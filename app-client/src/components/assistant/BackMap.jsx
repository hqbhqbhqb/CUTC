function BackMap({ targets = [], activeTargetId }) {
  const completed = targets.filter((target) => target.completed).length;
  return (
    <div className="rounded-3xl border border-[#dce9e6] bg-white p-5 shadow-[0_8px_30px_rgba(31,78,70,0.05)]">
      <div className="mb-4 flex items-center justify-between">
        <div><p className="text-xs font-bold tracking-[0.14em] text-[#2d7a6d]">BẢN ĐỒ VÙNG LƯNG</p><h3 className="mt-1 font-bold text-[#193b35]">Trái trước · Phải sau</h3></div>
        <span className="rounded-full bg-[#eef6f3] px-3 py-1 text-xs font-bold text-[#39766b]">{completed}/{targets.length || 0}</span>
      </div>
      <div className="relative mx-auto aspect-[3/4] max-h-[430px] w-full max-w-[330px] overflow-hidden rounded-[44%_44%_34%_34%] border border-[#d3e4df] bg-[linear-gradient(90deg,#e8f2ef_0_49.8%,#d0e1dd_50%,#edf5f3_50.2%)]">
        <div className="absolute left-[12%] top-[44%] rounded-full bg-white/75 px-3 py-1 text-[10px] font-bold text-[#68807a]">TRÁI</div>
        <div className="absolute right-[12%] top-[44%] rounded-full bg-white/75 px-3 py-1 text-[10px] font-bold text-[#68807a]">PHẢI</div>
        {targets.map((target) => {
          const active = target.id === activeTargetId;
          return (
            <div key={target.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${target.x * 100}%`, top: `${target.y * 100}%` }}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white transition ${target.completed ? "bg-[#66aa9c] opacity-45" : active ? "animate-pulse bg-[#e35f57] ring-8 ring-[#e35f57]/20" : "bg-[#dea59f]"}`}>{target.completed ? "✓" : target.coverage ? `${Math.round(target.coverage * 100)}%` : target.id}</div>
            </div>
          );
        })}
        {targets.length === 0 && <div className="absolute inset-0 flex items-center justify-center px-10 text-center text-xs leading-5 text-[#7d908b]">Các vùng phát hiện sẽ xuất hiện tại đây sau khi đưa lưng vào khung.</div>}
      </div>
    </div>
  );
}

export default BackMap;
