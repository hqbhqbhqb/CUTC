import { Hand, Volume2 } from "lucide-react";
import Card from "../common/Card";
import ProgressBar from "../common/ProgressBar";

function AIGuidance({ guidance, targetNumber, holding, holdProgress, handVisible, phase }) {
  const label = phase === "guiding" ? guidance.label : phase === "completed" ? "Đã hoàn thành" : "Đang chờ nhận diện";
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf5f2] text-[#2d7a6d]"><Volume2 size={20} /></div>
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b8c88]">Hướng dẫn bằng giọng nói</p><h2 className="font-bold">{targetNumber ? `Target #${targetNumber}` : "Chưa có target"}</h2></div>
      </div>
      <div className={`mt-6 rounded-2xl p-6 text-center ${holding ? "bg-[#e9f8f2]" : "bg-[#f2f8f6]"}`}>
        <p className="text-sm text-[#6e807b]">{handVisible ? "Hướng di chuyển" : "Chưa thấy ngón trỏ"}</p>
        <div className="mt-4 flex min-h-10 items-center justify-center gap-3 text-4xl font-bold text-[#2d7a6d]">
          {guidance.arrows.length ? guidance.arrows.map((arrow, index) => <span key={`${arrow}-${index}`}>{arrow}</span>) : <Hand size={35} />}
        </div>
        <p className="mt-4 text-lg font-bold uppercase tracking-[0.16em] text-[#2d7a6d]">{label}</p>
      </div>
      {holding && <div className="mt-5"><div className="mb-2 flex justify-between text-xs font-semibold text-[#527069]"><span>Giữ sát và xoa nhẹ</span><span>{Math.round(holdProgress)}%</span></div><ProgressBar value={holdProgress} /></div>}
      <div className={`mt-5 flex items-center gap-3 rounded-xl p-4 ${holding ? "bg-[#e8f7f1] text-[#316a5f]" : "bg-[#fff7e8] text-[#765c2f]"}`}>
        <div className={`h-3 w-3 rounded-full ${holding ? "animate-ping bg-[#2d9c7f]" : "animate-pulse bg-[#e3a43b]"}`} />
        <p className="text-sm">{holding ? "Nghe tiếng tít: giữ 3,5 giây và di chuyển nhẹ trong vùng." : "Dùng ngón trỏ, cụp các ngón còn lại và di chuyển chậm."}</p>
      </div>
    </Card>
  );
}

export default AIGuidance;
