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
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#173f38]">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-[#71827e]">Sign in to continue the medication schedule and progress saved on this device.</p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#38534e]">Email</label>
            <input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-[#d6e4e1] px-4 py-3 outline-none focus:border-[#2d7a6d] focus:ring-2 focus:ring-[#2d7a6d]/10" placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#38534e]">Password</label>
            <div className="relative">
              <input required minLength={6} type={showPassword ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-[#d6e4e1] px-4 py-3 pr-12 outline-none focus:border-[#2d7a6d] focus:ring-2 focus:ring-[#2d7a6d]/10" placeholder="At least 6 characters" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#71827e]" aria-label="Show or hide password">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a94c45]">{error}</p>}
          <Button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2">{loading ? "Signing in..." : "Sign in"} <ArrowRight size={18} /></Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#71827e]">New to DermaCare? <Link to="/register" className="font-bold text-[#247568]">Create an account</Link></p>
        <p className="mt-5 rounded-xl bg-[#f4f8f7] p-3 text-center text-xs leading-5 text-[#758682]">This MVP stores accounts locally. Create your account in this browser first.</p>
      </div>
    </main>
  );
}

export default Login;
