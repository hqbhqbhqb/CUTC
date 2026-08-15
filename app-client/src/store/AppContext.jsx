import { useEffect, useMemo, useState } from "react";
import { AppContext } from "./useApp";

const STORAGE_KEY = "dermacare-demo-v2";

const initialState = {
  accounts: [],
  currentUserId: null,
  disease: "pityriasis",
  medications: [],
  completions: {},
  reminderSettings: {
    deviceEnabled: false,
    email: null,
  },
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
    if (!saved) return initialState;
    const genderMap = {
      "Chưa cập nhật": "Not specified",
      Nam: "Male",
      "Nữ": "Female",
      "Khác": "Other",
      "Không muốn chia sẻ": "Prefer not to say",
    };
    return {
      ...initialState,
      ...saved,
      accounts: (saved.accounts || []).map((account) => ({
        ...account,
        gender: genderMap[account.gender] || account.gender || "Not specified",
      })),
    };
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

  useEffect(() => {
    if (!state.reminderSettings?.deviceEnabled || !("Notification" in window) || Notification.permission !== "granted") return undefined;
    let cancelled = false;
    const timers = [];

    const showReminder = async (task) => {
      const registration = "serviceWorker" in navigator
        ? await navigator.serviceWorker.register("/reminder-sw.js").catch(() => null)
        : null;
      const options = {
        body: `It is time for your ${task.type === "topical" ? "topical" : "oral"} medication: ${task.name}.`,
        tag: `dermacare-${task.id}`,
        renotify: true,
        data: { url: "/profile" },
      };
      if (registration) registration.showNotification("DermaCare medication reminder", options);
      else new Notification("DermaCare medication reminder", options);
    };

    const scheduleNext = (task) => {
      if (cancelled) return;
      const [hours, minutes] = task.time.split(":").map(Number);
      const next = new Date();
      next.setHours(hours, minutes, 0, 0);
      if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
      const timer = window.setTimeout(async () => {
        if (cancelled) return;
        await showReminder(task);
        scheduleNext(task);
      }, next.getTime() - Date.now());
      timers.push(timer);
    };

    tasks.forEach(scheduleNext);
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [state.reminderSettings?.deviceEnabled, tasks]);

  const register = async ({ username, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (state.accounts.some((account) => account.email === normalizedEmail)) {
      throw new Error("This email is already registered on this device.");
    }
    const account = {
      id: makeId("user"),
      username: username.trim(),
      name: username.trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      age: "",
      gender: "Not specified",
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
    if (!account) throw new Error("The email or password is incorrect.");
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

  const enableDeviceReminders = async () => {
    if (!("Notification" in window)) throw new Error("This browser does not support device notifications.");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Notification permission was not granted.");
    if ("serviceWorker" in navigator) await navigator.serviceWorker.register("/reminder-sw.js");
    setState((current) => ({
      ...current,
      reminderSettings: { ...current.reminderSettings, deviceEnabled: true },
    }));
  };

  const disableDeviceReminders = () => {
    setState((current) => ({
      ...current,
      reminderSettings: { ...current.reminderSettings, deviceEnabled: false },
    }));
  };

  const emailMedicationSignature = useMemo(
    () => state.medications
      .flatMap((medication) => medication.times.map((time) => `${medication.id}:${medication.name}:${medication.type}:${time}`))
      .sort()
      .join("|"),
    [state.medications],
  );

  const emailReminderState = state.reminderSettings?.email || null;

  const emailApi = async (payload) => {
    const response = await fetch("/api/email-reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Email reminders could not be updated.");
    return result;
  };

  const emailReminderItems = () => state.medications.flatMap((medication) =>
    medication.times.map((time) => ({ name: medication.name, type: medication.type, time })),
  );

  const requestEmailVerification = async () => {
    if (!user?.email) throw new Error("Sign in with a valid email address first.");
    return emailApi({
      action: "request-verification",
      email: user.email,
      website: "",
    });
  };

  const enableEmailReminders = async (token, includeDetails = false) => {
    if (!emailReminderItems().length) throw new Error("Add at least one medication time before enabling email reminders.");
    const result = await emailApi({
      action: "schedule",
      token,
      reminders: emailReminderItems(),
      timezoneOffset: new Date().getTimezoneOffset(),
      includeDetails,
    });
    setState((current) => ({
      ...current,
      reminderSettings: {
        ...current.reminderSettings,
        email: {
          enabled: true,
          email: result.email,
          ids: result.ids,
          managementToken: result.managementToken,
          scheduledUntil: result.scheduledUntil,
          reminderCount: result.reminderCount,
          dailyTimes: result.dailyTimes,
          includeDetails,
          medicationSignature: emailMedicationSignature,
        },
      },
    }));
    return result;
  };

  const disableEmailReminders = async () => {
    if (emailReminderState?.managementToken && emailReminderState?.ids?.length) {
      await emailApi({
        action: "cancel",
        token: emailReminderState.managementToken,
        ids: emailReminderState.ids,
      });
    }
    setState((current) => ({
      ...current,
      reminderSettings: { ...current.reminderSettings, email: null },
    }));
  };

  const refreshEmailReminders = async (includeDetails = emailReminderState?.includeDetails || false) => {
    const token = emailReminderState?.managementToken;
    if (!token) throw new Error("Verify your email again before refreshing reminders.");
    if (emailReminderState.ids?.length) {
      await emailApi({ action: "cancel", token, ids: emailReminderState.ids });
    }
    try {
      return await enableEmailReminders(token, includeDetails);
    } catch (refreshError) {
      setState((current) => ({
        ...current,
        reminderSettings: { ...current.reminderSettings, email: null },
      }));
      throw refreshError;
    }
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
    deviceRemindersEnabled: Boolean(state.reminderSettings?.deviceEnabled),
    enableDeviceReminders,
    disableDeviceReminders,
    emailReminderState,
    emailMedicationSignature,
    requestEmailVerification,
    enableEmailReminders,
    disableEmailReminders,
    refreshEmailReminders,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
