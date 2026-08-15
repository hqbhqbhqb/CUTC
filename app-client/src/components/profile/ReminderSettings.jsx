import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bell, BellOff, CheckCircle2, Clock3, LoaderCircle, Mail, MailCheck, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";

import Card from "../common/Card";
import Button from "../common/Button";
import { useApp } from "../../store/useApp";

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function ReminderSettings() {
  const {
    user,
    deviceRemindersEnabled,
    enableDeviceReminders,
    disableDeviceReminders,
    emailReminderState,
    emailMedicationSignature,
    requestEmailVerification,
    enableEmailReminders,
    disableEmailReminders,
    refreshEmailReminders,
  } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const verificationToken = searchParams.get("emailVerification");
  const verificationHandledRef = useRef("");
  const renewalHandledRef = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [provider, setProvider] = useState({ loading: true, configured: false, scheduleDays: 14 });
  const [includeDetails, setIncludeDetails] = useState(Boolean(emailReminderState?.includeDetails));

  useEffect(() => {
    let cancelled = false;
    fetch("/api/email-reminders")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((result) => {
        if (!cancelled) setProvider({ loading: false, configured: Boolean(result.configured), scheduleDays: result.scheduleDays || 14 });
      })
      .catch(() => {
        if (!cancelled) setProvider({ loading: false, configured: false, scheduleDays: 14 });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!verificationToken || !provider.configured || verificationHandledRef.current === verificationToken) return;
    verificationHandledRef.current = verificationToken;
    setBusy("verify");
    setError("");
    enableEmailReminders(verificationToken, false)
      .then((result) => {
        setMessage(`${result.reminderCount} email reminders were scheduled for ${result.email}.`);
        const next = new URLSearchParams(searchParams);
        next.delete("emailVerification");
        setSearchParams(next, { replace: true });
      })
      .catch((activationError) => setError(activationError.message))
      .finally(() => setBusy(""));
  }, [enableEmailReminders, provider.configured, searchParams, setSearchParams, verificationToken]);

  useEffect(() => {
    if (renewalHandledRef.current || !emailReminderState?.enabled || !emailReminderState.scheduledUntil) return;
    const expiresSoon = new Date(emailReminderState.scheduledUntil).getTime() - Date.now() < 3 * 24 * 60 * 60_000;
    const scheduleUnchanged = emailReminderState.medicationSignature === emailMedicationSignature;
    if (!expiresSoon || !scheduleUnchanged || !provider.configured) return;
    renewalHandledRef.current = true;
    setBusy("renew");
    refreshEmailReminders(emailReminderState.includeDetails)
      .then(() => setMessage("Email reminders were automatically renewed."))
      .catch((renewalError) => setError(renewalError.message))
      .finally(() => setBusy(""));
  }, [emailMedicationSignature, emailReminderState, provider.configured, refreshEmailReminders]);

  const enableDevice = async () => {
    setError("");
    try {
      await enableDeviceReminders();
    } catch (notificationError) {
      setError(notificationError.message);
    }
  };

  const sendVerification = async () => {
    setBusy("request");
    setError("");
    setMessage("");
    try {
      await requestEmailVerification();
      setMessage(`A confirmation link was sent to ${user?.email}. It expires in 30 minutes.`);
    } catch (verificationError) {
      setError(verificationError.message);
    } finally {
      setBusy("");
    }
  };

  const disableEmail = async () => {
    setBusy("disable");
    setError("");
    try {
      await disableEmailReminders();
      setMessage("All pending DermaCare email reminders were cancelled.");
    } catch (disableError) {
      setError(disableError.message);
    } finally {
      setBusy("");
    }
  };

  const refreshEmail = async () => {
    setBusy("renew");
    setError("");
    try {
      const result = await refreshEmailReminders(includeDetails);
      setMessage(`${result.reminderCount} updated reminders were scheduled.`);
    } catch (refreshError) {
      setError(refreshError.message);
    } finally {
      setBusy("");
    }
  };

  const scheduleChanged = emailReminderState?.enabled
    && emailReminderState.medicationSignature !== emailMedicationSignature;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d7a6d]">Medication reminders</p>
        <h2 className="mt-2 text-xl font-bold text-[#193b35]">Reminder delivery</h2>
        <p className="mt-1 text-sm leading-6 text-[#71827e]">Get a notification when a scheduled medication time arrives.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#dce9e6] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f4f1] text-[#2d7a6d]">
              {deviceRemindersEnabled ? <Bell size={19} /> : <BellOff size={19} />}
            </div>
            <div>
              <h3 className="font-bold text-[#284d47]">Device notification</h3>
              <p className="mt-1 text-xs leading-5 text-[#71827e]">Works while DermaCare remains open, including in a background tab.</p>
            </div>
          </div>
          <Button type="button" variant={deviceRemindersEnabled ? "outline" : "secondary"} onClick={deviceRemindersEnabled ? disableDeviceReminders : enableDevice} className="mt-5 w-full">
            {deviceRemindersEnabled ? "Disable notifications" : "Enable notifications"}
          </Button>
        </div>

        <div className="rounded-2xl border border-[#dce9e6] p-5">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${emailReminderState?.enabled ? "bg-[#e5f5ef] text-[#247568]" : "bg-[#eef2fa] text-[#6276a5]"}`}>
              {emailReminderState?.enabled ? <MailCheck size={19} /> : <Mail size={19} />}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-[#284d47]">Email reminder</h3>
              <p className="mt-1 break-words text-xs leading-5 text-[#71827e]">{emailReminderState?.enabled ? `Verified: ${emailReminderState.email}` : user?.email}</p>
            </div>
          </div>

          {provider.loading ? (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#f5f8f7] p-3 text-xs text-[#71827e]"><LoaderCircle className="animate-spin" size={15} /> Checking email service...</div>
          ) : !provider.configured ? (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#fff7e8] p-3 text-xs leading-5 text-[#765c2f]"><TriangleAlert size={16} className="mt-0.5 shrink-0" /> The deployment needs a server-only <code className="font-bold">RESEND_API_KEY</code> before email can be sent. No key is exposed to the browser.</div>
          ) : emailReminderState?.enabled ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-[#edf7f4] p-3 text-xs leading-5 text-[#45655f]"><CheckCircle2 className="mr-1.5 inline text-[#247568]" size={15} /> {emailReminderState.reminderCount} pending emails · through {formatDate(emailReminderState.scheduledUntil)}</div>
              {scheduleChanged && <div className="rounded-xl bg-[#fff7e8] p-3 text-xs leading-5 text-[#765c2f]"><Clock3 className="mr-1.5 inline" size={15} /> The medication schedule changed. Refresh email reminders to match it.</div>}
              <label className="flex items-start gap-2 text-xs leading-5 text-[#5f7772]"><input type="checkbox" checked={includeDetails} onChange={(event) => setIncludeDetails(event.target.checked)} className="mt-1 accent-[#2d7a6d]" /> Include medication names in reminder emails. Leave off for greater privacy.</label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" onClick={refreshEmail} disabled={Boolean(busy)} className="flex items-center justify-center gap-1 px-3 py-2 text-xs">{busy === "renew" ? <LoaderCircle className="animate-spin" size={14} /> : <RefreshCw size={14} />} Refresh</Button>
                <Button type="button" variant="outline" onClick={disableEmail} disabled={Boolean(busy)} className="px-3 py-2 text-xs">Disable</Button>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-xs leading-5 text-[#71827e]">A one-time email link verifies ownership before reminders are scheduled for the next {provider.scheduleDays} days.</p>
              <Button type="button" variant="secondary" onClick={sendVerification} disabled={Boolean(busy)} className="mt-3 flex w-full items-center justify-center gap-2">
                {busy === "request" || busy === "verify" ? <LoaderCircle className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                {busy === "verify" ? "Scheduling reminders..." : "Verify and enable email"}
              </Button>
            </div>
          )}
        </div>
      </div>
      {message && <p role="status" className="mt-4 rounded-xl bg-[#edf7f4] px-4 py-3 text-sm text-[#35655d]">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a94c45]">{error}</p>}
    </Card>
  );
}

export default ReminderSettings;
