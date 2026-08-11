import { Link, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";

function Register() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#DCE9E6] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Tạo tài khoản</h1>

        <p className="mt-2 text-sm text-[#71827E]">
          Tạo tài khoản để bắt đầu sử dụng DermaCare.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate("/");
          }}
          className="mt-7 space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">Username</label>

            <input
              className="w-full rounded-xl border border-[#D6E4E1] px-4 py-3 outline-none focus:border-[#2D7A6D]"
              placeholder="Your username"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>

            <input
              type="email"
              className="w-full rounded-xl border border-[#D6E4E1] px-4 py-3 outline-none focus:border-[#2D7A6D]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Mật khẩu</label>

            <input
              type="password"
              className="w-full rounded-xl border border-[#D6E4E1] px-4 py-3 outline-none focus:border-[#2D7A6D]"
              placeholder="••••••••"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-[#71827E]">
            <input type="checkbox" required className="mt-1" />

            <span>Tôi đồng ý với Terms & Conditions và Privacy Policy.</span>
          </label>

          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#71827E]">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-[#2D7A6D]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Register;
