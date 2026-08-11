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
              Tư thế ngón tay
            </p>
          </div>
        </div>

        <div className="p-7">
          <div className="mb-5 flex items-center gap-3">
            <Camera className="text-[#2D7A6D]" />

            <h3 className="text-lg font-bold">Hướng dẫn trước khi bắt đầu</h3>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-[#2D7A6D]" />

              <p className="text-sm leading-6 text-[#526A65]">
                Người dùng hãy dùng ngón trỏ và cụp các ngón còn lại.
              </p>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-[#2D7A6D]" />

              <p className="text-sm leading-6 text-[#526A65]">
                Đưa lưng vào vùng camera để hệ thống có thể nhận diện vùng da.
              </p>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-[#2D7A6D]" />

              <p className="text-sm leading-6 text-[#526A65]">
                Giữ chuyển động chậm và làm theo hướng dẫn của AI Assistant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ApplicationGuide;
