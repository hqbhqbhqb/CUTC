import { Camera, Scan } from "lucide-react";
import Card from "../common/Card";

function CameraView() {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-[#1B2B29]">
        {/* Mock camera */}

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Camera size={30} />
            </div>

            <p className="text-sm text-white/70">Camera preview</p>
          </div>
        </div>

        {/* Scan frame */}

        <div className="absolute left-1/2 top-1/2 h-[70%] w-[45%] -translate-x-1/2 -translate-y-1/2 rounded-[45%] border-2 border-white/70">
          <div className="absolute left-1/2 top-5 -translate-x-1/2">
            <Scan size={22} className="text-white" />
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-2 text-xs text-white backdrop-blur">
          Đưa lưng vào vùng camera
        </div>
      </div>
    </Card>
  );
}

export default CameraView;
