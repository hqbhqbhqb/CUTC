import { CheckCircle2 } from "lucide-react";
import Card from "../common/Card";

function TargetProgress() {
  const targets = [
    { id: 1, completed: false },
    { id: 2, completed: false },
    { id: 3, completed: true },
    { id: 4, completed: false },
    { id: 5, completed: false },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Target Progress</h3>

        <span className="text-sm text-[#71827E]">1 / 5</span>
      </div>

      <div className="mt-5 space-y-3">
        {targets.map((target) => (
          <div key={target.id} className="flex items-center gap-3">
            {target.completed ? (
              <CheckCircle2 size={20} className="text-[#2D7A6D]" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-[#C9D8D5]" />
            )}

            <span
              className={`text-sm ${
                target.completed ? "text-[#83918D] line-through" : "font-medium"
              }`}
            >
              Target #{target.id}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default TargetProgress;
