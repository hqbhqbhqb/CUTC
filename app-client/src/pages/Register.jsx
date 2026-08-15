import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, UserPlus } from "lucide-react";
import Button from "../components/common/Button";
import { useApp } from "../store/useApp";

function Register() {
  const navigate = useNavigate();
  const { register } = useApp();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-[#f4f9f7] px-5 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-[#dce9e6] bg-white p-7 shadow-[0_24px_70px_rgba(32,83,74,0.10)] sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f3ef] text-[#257568]"><UserPlus size={23} /></div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#173f38]">Create an account</h1>
        <p className="mt-2 text-sm leading-6 text-[#71827e]">Save your treatment schedule and track progress on this device.</p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#38534e]">Username</label>
            <input required minLength={2} autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="w-full rounded-xl border border-[#d6e4e1] px-4 py-3 outline-none focus:border-[#2d7a6d] focus:ring-2 focus:ring-[#2d7a6d]/10" placeholder="Your display name" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#38534e]">Email</label>
            <input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-[#d6e4e1] px-4 py-3 outline-none focus:border-[#2d7a6d] focus:ring-2 focus:ring-[#2d7a6d]/10" placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#38534e]">Password</label>
            <input required minLength={6} type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-[#d6e4e1] px-4 py-3 outline-none focus:border-[#2d7a6d] focus:ring-2 focus:ring-[#2d7a6d]/10" placeholder="At least 6 characters" />
          </div>
          <label className="flex items-start gap-3 text-sm leading-6 text-[#657a75]">
            <input type="checkbox" required className="mt-1 h-4 w-4 accent-[#247568]" />
            <span>I agree to the <Link to="/terms" className="font-bold text-[#247568] underline">Terms & Conditions</Link> and <Link to="/privacy" className="font-bold text-[#247568] underline">Privacy Policy</Link>.</span>
          </label>
          {error && <p role="alert" className="rounded-xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a94c45]">{error}</p>}
          <Button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2">{loading ? "Creating account..." : "Create account"} <ArrowRight size={18} /></Button>
        </form>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-[#5f7772]"><ShieldCheck size={16} className="text-[#247568]" /> Camera images stay inside the browser</div>
        <p className="mt-5 text-center text-sm text-[#71827e]">Already have an account? <Link to="/login" className="font-bold text-[#247568]">Sign in</Link></p>
      </div>
    </main>
  );
}

export default Register;
