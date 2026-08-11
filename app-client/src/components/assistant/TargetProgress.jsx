import { CheckCircle2, Circle } from "lucide-react";
import Card from "../common/Card";

function TargetProgress({ targets = [], activeTargetId }) {
  const completed = targets.filter((target) => target.completed).length;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between"><h3 className="font-bold">Tiến độ các target</h3><span className="text-sm font-semibold text-[#2d7a6d]">{completed} / {targets.length}</span></div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {targets.map((target) => (
          <div key={target.id} className={`flex items-center gap-2 rounded-xl border p-3 ${target.id === activeTargetId ? "border-[#e37b72] bg-[#fff4f3]" : "border-[#e3ece9]"}`}>
            {target.completed ? <CheckCircle2 size={19} className="text-[#2d7a6d]" /> : <Circle size={19} className={target.id === activeTargetId ? "text-[#d95f5f]" : "text-[#c9d8d5]"} />}
            <span className={`text-sm ${target.completed ? "text-[#83918d] line-through" : "font-semibold"}`}>Target #{target.id}</span>
          </div>
        ))}
        {targets.length === 0 && <p className="col-span-2 py-3 text-center text-sm text-[#82928e]">Chưa phát hiện target.</p>}
      </div>
    </Card>
  );
}

export default TargetProgress;
