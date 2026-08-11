import { useEffect, useMemo, useState } from "react";
import { AppContext } from "./useApp";

const STORAGE_KEY = "dermacare-demo-v2";

const initialState = {
  accounts: [],
  currentUserId: null,
  disease: "pityriasis",
  medications: [],
  completions: {},
};

function getTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...initialState, ...saved } : initialState;
  } catch {
    return initialState;
  }
}

async function hashPassword(password) {
  if (!window.crypto?.subtle) return `demo-${password}`;
  const data = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function makeId(prefix) {
  return `${prefix}-${window.crypto?.randomUUID?.() || Date.now()}`;
}

export function AppProvider({ children }) {
  const [state, setState] = useState(readState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const user = useMemo(
    () => state.accounts.find((account) => account.id === state.currentUserId) || null,
    [state.accounts, state.currentUserId],
  );

  const today = getTodayKey();
  const todayCompletions = useMemo(
    () => state.completions[today] || [],
    [state.completions, today],
  );

  const tasks = useMemo(
    () =>
      state.medications
        .flatMap((medication) =>
          medication.times.map((time, index) => ({
            id: `${medication.id}-${index}`,
            medicationId: medication.id,
            slotIndex: index,
            name: medication.name,
            type: medication.type,
            time,
            completed: todayCompletions.includes(`${medication.id}-${index}`),
          })),
        )
        .sort((a, b) => a.time.localeCompare(b.time)),
    [state.medications, todayCompletions],
  );

  const register = async ({ username, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (state.accounts.some((account) => account.email === normalizedEmail)) {
      throw new Error("Email này đã được đăng ký trên thiết bị.");
    }
    const account = {
      id: makeId("user"),
      username: username.trim(),
      name: username.trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      age: "",
      gender: "Chưa cập nhật",
      avatar: "",
    };
    setState((current) => ({
      ...current,
      accounts: [...current.accounts, account],
      currentUserId: account.id,
    }));
    return account;
  };

  const login = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await hashPassword(password);
    const account = state.accounts.find(
      (item) => item.email === normalizedEmail && item.passwordHash === passwordHash,
    );
    if (!account) throw new Error("Email hoặc mật khẩu chưa đúng.");
    setState((current) => ({ ...current, currentUserId: account.id }));
    return account;
  };

  const logout = () => {
    setState((current) => ({ ...current, currentUserId: null }));
  };

  const updateProfile = (updates) => {
    if (!state.currentUserId) return;
    setState((current) => ({
      ...current,
      accounts: current.accounts.map((account) =>
        account.id === current.currentUserId ? { ...account, ...updates } : account,
      ),
    }));
  };

  const setDisease = (disease) => {
    setState((current) => ({ ...current, disease }));
  };

  const addMedication = (medication) => {
    setState((current) => ({
      ...current,
      medications: [
        ...current.medications,
        { ...medication, id: makeId("medication") },
      ],
    }));
  };

  const removeMedication = (id) => {
    setState((current) => ({
      ...current,
      medications: current.medications.filter((item) => item.id !== id),
    }));
  };

  const updateMedication = (id, updates) => {
    setState((current) => ({
      ...current,
      medications: current.medications.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    }));
  };

  const toggleTask = (taskId, date = today) => {
    setState((current) => {
      const completed = current.completions[date] || [];
      const next = completed.includes(taskId)
        ? completed.filter((id) => id !== taskId)
        : [...completed, taskId];
      return {
        ...current,
        completions: { ...current.completions, [date]: next },
      };
    });
  };

  const completeTopicalSession = () => {
    const nextTask = tasks.find((task) => task.type === "topical" && !task.completed);
    if (nextTask) toggleTask(nextTask.id);
    return nextTask;
  };

  const progressDays = useMemo(() => {
    const totalPerDay = Math.max(tasks.length, 1);
    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - index));
      const key = getTodayKey(date);
      const count = (state.completions[key] || []).length;
      return { key, day: date.getDate(), count, ratio: Math.min(count / totalPerDay, 1) };
    });
  }, [state.completions, tasks.length]);

  const value = {
    user,
    disease: state.disease,
    medications: state.medications,
    tasks,
    today,
    progressDays,
    register,
    login,
    logout,
    updateProfile,
    setDisease,
    addMedication,
    removeMedication,
    updateMedication,
    toggleTask,
    completeTopicalSession,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
