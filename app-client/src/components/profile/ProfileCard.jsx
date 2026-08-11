import { Mail, Calendar, User } from "lucide-react";
import Card from "../common/Card";

function ProfileCard() {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#DCEDEA] text-3xl font-bold text-[#2D7A6D]">
          A
        </div>

        <div className="mt-5 sm:ml-5 sm:mt-0">
          <h2 className="text-2xl font-bold">Alex Nguyen</h2>

          <p className="mt-1 text-sm text-[#71827E]">Người dùng</p>
        </div>
      </div>

      <div className="mt-7 space-y-4 border-t border-[#E2ECE9] pt-6">
        <div className="flex items-center gap-3">
          <Mail size={18} className="text-[#2D7A6D]" />

          <div>
            <p className="text-xs text-[#8A9A96]">Email</p>

            <p className="text-sm font-medium">alex@example.com</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-[#2D7A6D]" />

          <div>
            <p className="text-xs text-[#8A9A96]">Tuổi</p>

            <p className="text-sm font-medium">18</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <User size={18} className="text-[#2D7A6D]" />

          <div>
            <p className="text-xs text-[#8A9A96]">Giới tính</p>

            <p className="text-sm font-medium">Nam</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ProfileCard;
