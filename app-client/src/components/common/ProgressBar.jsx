function ProgressBar({ value = 0 }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5EFEC]">
      <div
        className="h-full rounded-full bg-[#2D7A6D] transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default ProgressBar;
