import { CalendarCheck2, Flame, Target } from "lucide-react";
import Card from "../common/Card";
import ProgressBar from "../common/ProgressBar";
import { useApp } from "../../store/useApp";

function ProgressDashboard() {
  const { progressDays, tasks } = useApp();
  const totalCompleted = progressDays.reduce((sum, day) => sum + day.count, 0);
  const possible = tasks.length * 30;
  const percentage = possible ? Math.round((totalCompleted / possible) * 100) : 0;
  let streak = 0;
  for (let index = progressDays.length - 1; index >= 0; index -= 1) {
    if (progressDays[index].count > 0) streak += 1;
    else if (index !== progressDays.length - 1) break;
  }
  return (
    <Card className="p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d7a6d]">30 ngày gần nhất</p><h2 className="mt-2 text-xl font-bold text-[#193b35]">Tiến độ điều trị</h2><p className="mt-1 text-sm text-[#71827e]">Mỗi ô đậm hơn khi bạn hoàn thành nhiều task hơn.</p></div>
        <div className="text-left sm:text-right"><p className="text-3xl font-bold text-[#2d7a6d]">{percentage}%</p><p className="text-xs text-[#879691]">tỷ lệ hoàn thành</p></div>
      </div>
      <div className="mt-6"><ProgressBar value={percentage} /></div>
      <div className="mt-7 grid grid-cols-10 gap-2 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
        {progressDays.map((day) => <div key={day.key} title={`${day.key}: ${day.count} task`} className={`aspect-square rounded-[4px] ${day.ratio === 0 ? "bg-[#e7efed]" : day.ratio < 0.5 ? "bg-[#b6d8cf]" : day.ratio < 1 ? "bg-[#75b5a6]" : "bg-[#327f70]"}`} />)}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#f3f8f6] p-4"><CalendarCheck2 size={19} className="text-[#2d7a6d]" /><p className="mt-3 text-xl font-bold">{totalCompleted}</p><p className="text-xs text-[#71827e]">task hoàn thành</p></div>
        <div className="rounded-2xl bg-[#fff7e8] p-4"><Flame size={19} className="text-[#d89531]" /><p className="mt-3 text-xl font-bold">{streak}</p><p className="text-xs text-[#71827e]">ngày liên tiếp</p></div>
        <div className="rounded-2xl bg-[#eef2fa] p-4"><Target size={19} className="text-[#6578a7]" /><p className="mt-3 text-xl font-bold">{tasks.length}</p><p className="text-xs text-[#71827e]">task mỗi ngày</p></div>
      </div>
    </Card>
  );
}

export default ProgressDashboard;
