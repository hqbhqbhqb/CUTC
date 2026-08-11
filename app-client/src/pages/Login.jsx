import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import Button from "../components/common/Button";
import { useApp } from "../store/useApp";

function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/");
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-[#f4f9f7] px-5 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-[#dce9e6] bg-white p-7 shadow-[0_24px_70px_rgba(32,83,74,0.10)] sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f3ef] text-[#257568]"><LockKeyhole size={23} /></div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#173f38]">Chào mừng trở lại</h1>
        <p className="mt-2 text-sm leading-6 text-[#71827e]">Đăng nhập để tiếp tục lịch thuốc và tiến độ đã lưu trên thiết bị này.</p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#38534e]">Email</label>
            <input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-[#d6e4e1] px-4 py-3 outline-none focus:border-[#2d7a6d] focus:ring-2 focus:ring-[#2d7a6d]/10" placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#38534e]">Mật khẩu</label>
            <div className="relative">
              <input required minLength={6} type={showPassword ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-[#d6e4e1] px-4 py-3 pr-12 outline-none focus:border-[#2d7a6d] focus:ring-2 focus:ring-[#2d7a6d]/10" placeholder="Tối thiểu 6 ký tự" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#71827e]" aria-label="Hiện hoặc ẩn mật khẩu">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a94c45]">{error}</p>}
          <Button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2">{loading ? "Đang đăng nhập..." : "Đăng nhập"} <ArrowRight size={18} /></Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#71827e]">Chưa có tài khoản? <Link to="/register" className="font-bold text-[#247568]">Đăng ký</Link></p>
        <p className="mt-5 rounded-xl bg-[#f4f8f7] p-3 text-center text-xs leading-5 text-[#758682]">Bản MVP lưu tài khoản cục bộ. Hãy đăng ký trước trên trình duyệt này.</p>
      </div>
    </main>
  );
}

export default Login;
