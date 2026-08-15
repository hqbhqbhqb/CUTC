import { Hand, Camera, CheckCircle2 } from "lucide-react";
import Card from "../common/Card";

function ApplicationGuide() {
  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-2">
        <div className="flex min-h-[280px] items-center justify-center bg-[#E8F3F0]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white text-[#2D7A6D] shadow-sm">
              <Hand size={48} />
            </div>

            <p className="text-sm font-medium text-[#52706A]">
              Finger position
            </p>
          </div>
        </div>

        <div className="p-7">
          <div className="mb-5 flex items-center gap-3">
            <Camera className="text-[#2D7A6D]" />

            <h3 className="text-lg font-bold">Before you begin</h3>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-[#2D7A6D]" />

              <p className="text-sm leading-6 text-[#526A65]">
                Point with your index finger and keep the other fingers folded.
              </p>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-[#2D7A6D]" />

              <p className="text-sm leading-6 text-[#526A65]">
                Keep your back inside the camera frame so the system can scan the skin area.
              </p>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-[#2D7A6D]" />

              <p className="text-sm leading-6 text-[#526A65]">
                Move slowly and follow the AI Assistant's voice guidance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ApplicationGuide;
