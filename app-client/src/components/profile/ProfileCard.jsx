import { useState } from "react";
import { Camera, Mail, Pencil, Save, User } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import { useApp } from "../../store/useApp";

function ProfileCard() {
  const { user, updateProfile } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name || "", age: user.age || "", gender: user.gender || "Chưa cập nhật" });

  const save = () => {
    updateProfile(form);
    setEditing(false);
  };

  const uploadAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      window.alert("Ảnh đại diện cần nhỏ hơn 1,5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateProfile({ avatar: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <Card className="p-6 lg:sticky lg:top-24">
      <div className="text-center">
        <label className="group relative mx-auto block h-24 w-24 cursor-pointer">
          {user.avatar ? <img src={user.avatar} alt="Ảnh đại diện" className="h-24 w-24 rounded-full object-cover" /> : <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#dcedea] text-3xl font-bold text-[#2d7a6d]">{user.username.charAt(0).toUpperCase()}</span>}
          <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#2d7a6d] text-white"><Camera size={14} /></span>
          <input type="file" accept="image/*" onChange={uploadAvatar} className="sr-only" />
        </label>
        <h2 className="mt-5 text-xl font-bold text-[#214d46]">{user.name || user.username}</h2>
        <p className="mt-1 text-sm text-[#71827e]">@{user.username}</p>
      </div>

      {editing ? (
        <div className="mt-7 space-y-4 border-t border-[#e2ece9] pt-6">
          <div><label className="mb-1.5 block text-xs font-bold text-[#607772]">Họ và tên</label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-[#d6e4e1] px-3 py-2.5 text-sm outline-none focus:border-[#2d7a6d]" /></div>
          <div><label className="mb-1.5 block text-xs font-bold text-[#607772]">Tuổi</label><input type="number" min="1" max="120" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} className="w-full rounded-xl border border-[#d6e4e1] px-3 py-2.5 text-sm outline-none focus:border-[#2d7a6d]" /></div>
          <div><label className="mb-1.5 block text-xs font-bold text-[#607772]">Giới tính</label><select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} className="w-full rounded-xl border border-[#d6e4e1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2d7a6d]"><option>Chưa cập nhật</option><option>Nam</option><option>Nữ</option><option>Khác</option><option>Không muốn chia sẻ</option></select></div>
          <Button onClick={save} className="flex w-full items-center justify-center gap-2"><Save size={17} /> Lưu thay đổi</Button>
        </div>
      ) : (
        <div className="mt-7 space-y-4 border-t border-[#e2ece9] pt-6">
          <div className="flex items-center gap-3"><Mail size={18} className="text-[#2d7a6d]" /><div className="min-w-0"><p className="text-xs text-[#8a9a96]">Email đăng ký</p><p className="truncate text-sm font-medium">{user.email}</p></div></div>
          <div className="flex items-center gap-3"><User size={18} className="text-[#2d7a6d]" /><div><p className="text-xs text-[#8a9a96]">Tuổi · Giới tính</p><p className="text-sm font-medium">{user.age || "Chưa cập nhật"} · {user.gender}</p></div></div>
          <Button onClick={() => setEditing(true)} variant="outline" className="mt-2 flex w-full items-center justify-center gap-2"><Pencil size={16} /> Chỉnh hồ sơ</Button>
        </div>
      )}
    </Card>
  );
}

export default ProfileCard;
