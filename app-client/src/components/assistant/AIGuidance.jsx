import { ArrowUp, ArrowRight, Volume2 } from "lucide-react";

import Card from "../common/Card";

function AIGuidance() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5F2] text-[#2D7A6D]">
          <Volume2 size={20} />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#7B8C88]">
            AI Guidance
          </p>

          <h2 className="font-bold">Target #1</h2>
        </div>
      </div>

      <div className="mt-7 rounded-2xl bg-[#F2F8F6] p-6 text-center">
        <p className="text-sm text-[#6E807B]">Hướng dẫn di chuyển</p>

        <div className="mt-4 flex items-center justify-center gap-4">
          <ArrowRight size={32} className="text-[#2D7A6D]" />

          <ArrowRight size={32} className="text-[#2D7A6D]" />

          <ArrowRight size={32} className="text-[#2D7A6D]" />

          <ArrowUp size={32} className="text-[#2D7A6D]" />

          <ArrowUp size={32} className="text-[#2D7A6D]" />
        </div>

        <p className="mt-4 text-lg font-bold tracking-[0.25em] text-[#2D7A6D]">
          RIGHT RIGHT RIGHT UP UP
        </p>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#FFF7E8] p-4">
        <div className="h-3 w-3 animate-pulse rounded-full bg-[#E3A43B]" />

        <p className="text-sm text-[#765C2F]">
          Di chuyển ngón tay đến vùng được đánh dấu.
        </p>
      </div>
    </Card>
  );
}

export default AIGuidance;
