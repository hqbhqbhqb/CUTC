import { useState } from "react";
import { CheckCircle2, ScanFace } from "lucide-react";

import CameraView from "../components/assistant/CameraView";
import BackMap from "../components/assistant/BackMap";
import AIGuidance from "../components/assistant/AIGuidance";
import TargetProgress from "../components/assistant/TargetProgress";
import Button from "../components/common/Button";

function AIAssistant() {
  const [started, setStarted] = useState(false);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-[#2D7A6D]">AI ASSISTANT</p>

        <h1 className="mt-2 text-3xl font-bold">Hướng dẫn bôi thuốc</h1>

        <p className="mt-2 max-w-2xl text-[#71827E]">
          AI sẽ giúp bạn xác định từng vùng cần bôi và hướng dẫn vị trí ngón tay
          theo thời gian thực.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        {/* LEFT */}

        <div className="space-y-6">
          <CameraView />

          <div className="rounded-2xl border border-[#DCE9E6] bg-white p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF5F2] text-[#2D7A6D]">
                <ScanFace size={22} />
              </div>

              <div>
                <h3 className="font-bold">Trạng thái hệ thống</h3>

                <p className="mt-1 text-sm text-[#71827E]">
                  {started
                    ? "Đang phân tích vùng da..."
                    : "Sẵn sàng bắt đầu quét"}
                </p>
              </div>
            </div>
          </div>

          {!started && (
            <Button onClick={() => setStarted(true)} className="w-full">
              Bắt đầu nhận diện
            </Button>
          )}
        </div>

        {/* RIGHT */}

        <div className="space-y-6">
          <div className="rounded-2xl bg-[#193B35] p-6 text-white">
            <p className="text-sm text-white/60">Detection Result</p>

            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-bold">5</span>

              <span className="pb-2 text-sm text-white/70">
                vùng được phát hiện
              </span>
            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[20%] rounded-full bg-[#83C2B4]" />
            </div>

            <p className="mt-3 text-xs text-white/60">Bắt đầu target #1</p>
          </div>

          <BackMap />

          <AIGuidance />

          <TargetProgress />

          <div className="flex items-center gap-3 rounded-xl bg-[#EAF5F2] p-4">
            <CheckCircle2 size={20} className="text-[#2D7A6D]" />

            <p className="text-sm text-[#45655F]">
              Khi hoàn thành tất cả target, lần bôi thuốc sẽ được ghi nhận vào
              tiến độ.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AIAssistant;
