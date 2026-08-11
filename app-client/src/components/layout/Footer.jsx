import { ShieldCheck, Mail, Lock } from "lucide-react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-20 border-t border-[#DCE9E6] bg-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* BRAND */}

          <div>
            <Link to="/" className="text-xl font-bold text-[#214D46]">
              DermaCare
            </Link>

            <p className="mt-3 max-w-sm text-sm leading-6 text-[#71827E]">
              Hỗ trợ người dùng theo dõi lịch thuốc và thực hiện quá trình chăm
              sóc da một cách thuận tiện hơn.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs text-[#71827E]">
              <ShieldCheck size={16} className="text-[#2D7A6D]" />
              Dữ liệu người dùng được bảo mật.
            </div>
          </div>

          {/* NAVIGATION */}

          <div>
            <h3 className="text-sm font-semibold text-[#294D47]">Navigation</h3>

            <div className="mt-4 flex flex-col gap-3">
              <Link
                to="/"
                className="text-sm text-[#71827E] hover:text-[#2D7A6D]"
              >
                Home
              </Link>

              <Link
                to="/assistant"
                className="text-sm text-[#71827E] hover:text-[#2D7A6D]"
              >
                AI Assistant
              </Link>

              <Link
                to="/profile"
                className="text-sm text-[#71827E] hover:text-[#2D7A6D]"
              >
                Profile
              </Link>
            </div>
          </div>

          {/* INFORMATION */}

          <div>
            <h3 className="text-sm font-semibold text-[#294D47]">
              Information
            </h3>

            <div className="mt-4 space-y-3">
              <Link to="/privacy" className="flex items-center gap-2 text-sm text-[#71827E] hover:text-[#2D7A6D]">
                <Lock size={16} />
                Privacy Policy
              </Link>

              <Link to="/terms" className="flex items-center gap-2 text-sm text-[#71827E] hover:text-[#2D7A6D]">
                <ShieldCheck size={16} />
                Terms & Conditions
              </Link>

              <div className="flex items-center gap-2 text-sm text-[#71827E]">
                <Mail size={16} />
                Contact us
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[#E5EEEC] pt-6 text-xs text-[#8A9995] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 DermaCare. All rights reserved.</p>

          <p>For demonstration purposes only.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
