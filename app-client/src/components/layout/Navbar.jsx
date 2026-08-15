import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { UserCircle, Stethoscope, Menu, X, LogIn, LogOut } from "lucide-react";

import PageContainer from "./PageContainer";
import { useApp } from "../../store/useApp";

function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useApp();

  const links = [
    {
      name: "Home",
      path: "/",
    },
    {
      name: "AI Assistant",
      path: "/assistant",
    },
    {
      name: "Profile",
      path: "/profile",
    },
  ];

  return (
    <header
      className="
        fixed
        left-0
        right-0
        top-0
        z-50
        border-b
        border-[#DCE9E6]
        bg-white/95
        shadow-sm
        backdrop-blur
      "
    >
      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <PageContainer className="flex items-center justify-between py-4">
        {/* Logo */}

        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D7A6D] text-white">
            <Stethoscope size={22} />
          </div>

          <span className="text-xl font-bold text-[#214D46]">DermaCare</span>
        </Link>

        {/* Desktop navigation */}

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive
                    ? "text-[#2D7A6D]"
                    : "text-[#637773] hover:text-[#2D7A6D]"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Desktop profile */}

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-2 rounded-xl bg-[#EFF6F4] px-4 py-2 text-sm font-medium text-[#315D56]">
                <UserCircle size={19} /> {user.username}
              </Link>
              <button type="button" onClick={logout} className="rounded-xl p-2.5 text-[#6f817d] hover:bg-[#f1f6f4]" aria-label="Sign out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="flex items-center gap-2 rounded-xl bg-[#214d46] px-4 py-2.5 text-sm font-semibold text-white">
              <LogIn size={18} /> Sign in
            </Link>
          )}
        </div>

        {/* Mobile menu button */}

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="
            rounded-lg
            p-2
            text-[#315D56]
            transition
            hover:bg-[#EFF6F4]
            md:hidden
          "
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </PageContainer>

      {/* =====================================================
          MOBILE DROPDOWN
      ====================================================== */}

      {open && (
        <div
          className="
            absolute
            left-0
            right-0
            top-full
            border-b
            border-[#DCE9E6]
            bg-white
            shadow-lg
            md:hidden
          "
        >
          <PageContainer className="py-3">
            <nav className="flex flex-col">
              {links.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `
                    rounded-lg
                    px-3
                    py-3
                    text-sm
                    font-medium
                    transition
                    ${
                      isActive
                        ? "bg-[#EFF6F4] text-[#2D7A6D]"
                        : "text-[#49645F] hover:bg-[#F5F9F7]"
                    }
                  `
                  }
                >
                  {link.name}
                </NavLink>
              ))}
              <div className="mt-2 border-t border-[#e3ece9] pt-2">
                {user ? (
                  <button type="button" onClick={() => { logout(); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-[#49645F]">
                    <LogOut size={18} /> Sign out ({user.username})
                  </button>
                ) : (
                  <Link to="/login" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-[#247568]">
                    <LogIn size={18} /> Sign in / Sign up
                  </Link>
                )}
              </div>
            </nav>
          </PageContainer>
        </div>
      )}
    </header>
  );
}

export default Navbar;
