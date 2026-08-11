import { Link, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";

function Login() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#DCE9E6] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Chào mừng trở lại</h1>

        <p className="mt-2 text-sm text-[#71827E]">
          Đăng nhập để tiếp tục theo dõi tiến độ.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate("/");
          }}
          className="mt-7 space-y-5"
        >
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

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#71827E]">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-semibold text-[#2D7A6D]">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
