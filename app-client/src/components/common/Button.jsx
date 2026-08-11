function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
}) {
  const variants = {
    primary: "bg-[#2D7A6D] text-white hover:bg-[#24665B]",
    secondary: "bg-[#E3EFEC] text-[#24564E] hover:bg-[#D5E6E1]",
    outline:
      "border border-[#BCD2CD] bg-white text-[#315D56] hover:bg-[#F2F8F6]",
    danger: "bg-[#FCE8E8] text-[#B54A4A] hover:bg-[#F9DADA]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-xl px-5 py-3
        font-medium transition disabled:cursor-not-allowed disabled:opacity-45
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default Button;
