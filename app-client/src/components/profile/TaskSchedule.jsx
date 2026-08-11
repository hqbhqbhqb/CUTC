import { Clock3, Pill, Droplets, Check } from "lucide-react";

import Card from "../common/Card";

function TaskSchedule() {
  const tasks = [
    {
      time: "08:00",
      name: "Thuốc uống",
      medicine: "Medicine A",
      type: "oral",
      completed: true,
    },
    {
      time: "09:00",
      name: "Thuốc bôi",
      medicine: "Cream A",
      type: "topical",
      completed: true,
    },
    {
      time: "14:00",
      name: "Thuốc bôi",
      medicine: "Cream A",
      type: "topical",
      completed: false,
    },
    {
      time: "20:00",
      name: "Thuốc uống",
      medicine: "Medicine A",
      type: "oral",
      completed: false,
    },
  ];

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold">Task Schedule</h2>

        <p className="mt-1 text-sm text-[#71827E]">Lịch dùng thuốc hôm nay</p>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={`${task.time}-${task.name}`}
            className="flex items-center gap-4 rounded-xl border border-[#E3ECE9] p-4"
          >
            <div className="w-14 text-center">
              <p className="text-sm font-bold">{task.time}</p>
            </div>

            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                task.type === "oral"
                  ? "bg-[#EEF2FA] text-[#6276A5]"
                  : "bg-[#EAF5F2] text-[#2D7A6D]"
              }`}
            >
              {task.type === "oral" ? (
                <Pill size={19} />
              ) : (
                <Droplets size={19} />
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold">{task.name}</p>

              <p className="text-xs text-[#83918D]">{task.medicine}</p>
            </div>

            {task.completed ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DFF0EA] text-[#2D7A6D]">
                <Check size={16} />
              </div>
            ) : (
              <Clock3 size={18} className="text-[#A3B0AD]" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default TaskSchedule;
