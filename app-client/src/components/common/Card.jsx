function Card({ children, className = "" }) {
  return (
    <div
      className={`
        rounded-2xl
        border border-[#DCE9E6]
        bg-white
        shadow-[0_8px_30px_rgba(31,78,70,0.05)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Card;
