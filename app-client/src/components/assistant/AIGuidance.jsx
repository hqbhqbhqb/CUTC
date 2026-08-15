import { Hand, Volume2 } from "lucide-react";
import Card from "../common/Card";
import ProgressBar from "../common/ProgressBar";

function AIGuidance({ guidance, targetNumber, holding, holdProgress, coverageProgress, contactProgress, handVisible, phase }) {
  const label = phase === "guiding" ? guidance.label : phase === "completed" ? "Completed" : "Waiting for detection";
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf5f2] text-[#2d7a6d]"><Volume2 size={20} /></div>
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b8c88]">Voice guidance</p><h2 className="font-bold">{targetNumber ? `Target #${targetNumber}` : "No target yet"}</h2></div>
      </div>
      <div className={`mt-6 rounded-2xl p-6 text-center ${holding ? "bg-[#e9f8f2]" : "bg-[#f2f8f6]"}`}>
        <p className="text-sm text-[#6e807b]">{handVisible ? "Movement direction" : "Index finger not detected"}</p>
        <div className="mt-4 flex min-h-10 items-center justify-center gap-3 text-4xl font-bold text-[#2d7a6d]">
          {guidance.arrows.length ? guidance.arrows.map((arrow, index) => <span key={`${arrow}-${index}`}>{arrow}</span>) : <Hand size={35} />}
        </div>
        <p className="mt-4 text-lg font-bold uppercase tracking-[0.16em] text-[#2d7a6d]">{label}</p>
      </div>
      {targetNumber && (
        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-xs font-semibold text-[#527069]"><span>Area covered</span><span>{Math.round(coverageProgress)}%</span></div>
            <ProgressBar value={coverageProgress} />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-xs font-semibold text-[#527069]"><span>Contact time</span><span>{Math.round(contactProgress)}%</span></div>
            <ProgressBar value={contactProgress} />
          </div>
          <p className="text-xs leading-5 text-[#71827e]">Complete at least 90% of the area with three seconds of contact and a gentle rubbing motion.</p>
        </div>
      )}
      <div className={`mt-5 flex items-center gap-3 rounded-xl p-4 ${holding ? "bg-[#e8f7f1] text-[#316a5f]" : "bg-[#fff7e8] text-[#765c2f]"}`}>
        <div className={`h-3 w-3 rounded-full ${holding ? "animate-ping bg-[#2d9c7f]" : "animate-pulse bg-[#e3a43b]"}`} />
        <p className="text-sm">{holding ? `Covering a new section · overall progress ${Math.round(holdProgress)}%.` : "Follow the directions to reach an uncovered section."}</p>
      </div>
    </Card>
  );
}

export default AIGuidance;
