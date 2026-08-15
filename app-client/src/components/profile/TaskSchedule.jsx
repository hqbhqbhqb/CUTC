import { useState } from "react";
import { Check, Clock3, Droplets, Pencil, Pill, Save, Trash2 } from "lucide-react";
import Card from "../common/Card";
import { useApp } from "../../store/useApp";

function TaskSchedule() {
  const { tasks, medications, toggleTask, updateMedication, removeMedication } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [editingTime, setEditingTime] = useState("");

  const saveTime = (task) => {
    const medication = medications.find((item) => item.id === task.medicationId);
    if (!medication) return;
    const times = [...medication.times];
    times[task.slotIndex] = editingTime;
    updateMedication(medication.id, { times });
    setEditingId(null);
  };

  return (
    <Card className="p-6">
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d7a6d]">Task schedule</p><h2 className="mt-2 text-xl font-bold text-[#193b35]">Today's medication schedule</h2><p className="mt-1 text-sm leading-6 text-[#71827e]">You can change a time or remove a medication after receiving updated medical instructions.</p></div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e3ece9] p-4 sm:flex-nowrap">
            <button type="button" onClick={() => toggleTask(task.id)} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${task.completed ? "border-[#2d7a6d] bg-[#2d7a6d] text-white" : "border-[#cbdad6] text-transparent"}`} aria-label="Mark as complete"><Check size={16} /></button>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${task.type === "oral" ? "bg-[#eef2fa] text-[#6276a5]" : "bg-[#eaf5f2] text-[#2d7a6d]"}`}>{task.type === "oral" ? <Pill size={19} /> : <Droplets size={19} />}</div>
            <div className="min-w-[130px] flex-1"><p className={`text-sm font-semibold ${task.completed ? "text-[#83918d] line-through" : ""}`}>{task.name}</p><p className="mt-1 text-xs text-[#83918d]">{task.type === "oral" ? "Oral medication" : "Topical medication"}</p></div>
            {editingId === task.id ? (
              <div className="flex items-center gap-2"><input type="time" value={editingTime} onChange={(event) => setEditingTime(event.target.value)} className="rounded-lg border border-[#d6e4e1] px-2 py-2 text-sm" /><button type="button" onClick={() => saveTime(task)} className="rounded-lg bg-[#e8f4f1] p-2 text-[#2d7a6d]" aria-label="Save time"><Save size={17} /></button></div>
            ) : (
              <button type="button" onClick={() => { setEditingId(task.id); setEditingTime(task.time); }} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[#38534e] hover:bg-[#f3f8f6]"><Clock3 size={16} /> {task.time} <Pencil size={13} /></button>
            )}
            <button type="button" onClick={() => removeMedication(task.medicationId)} className="rounded-lg p-2 text-[#b85c5c] hover:bg-[#fbeaea]" aria-label={`Remove ${task.name}`}><Trash2 size={17} /></button>
          </div>
        ))}
        {tasks.length === 0 && <div className="rounded-2xl bg-[#f5f8f7] px-5 py-9 text-center text-sm text-[#7d8e8a]">No medication is scheduled. Set up a treatment plan on the Home page.</div>}
      </div>
    </Card>
  );
}

export default TaskSchedule;
