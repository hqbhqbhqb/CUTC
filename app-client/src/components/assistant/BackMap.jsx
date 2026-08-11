function BackMap() {
  const spots = [
    {
      id: 1,
      x: "42%",
      y: "27%",
      completed: false,
      active: true,
    },
    {
      id: 2,
      x: "57%",
      y: "32%",
      completed: false,
      active: false,
    },
    {
      id: 3,
      x: "36%",
      y: "48%",
      completed: true,
      active: false,
    },
    {
      id: 4,
      x: "62%",
      y: "52%",
      completed: false,
      active: false,
    },
    {
      id: 5,
      x: "45%",
      y: "68%",
      completed: false,
      active: false,
    },
  ];

  return (
    <div className="relative mx-auto aspect-[3/4] max-h-[500px] w-full max-w-[380px] rounded-[45%] bg-[#E5EFEC]">
      {/* Spine */}

      <div className="absolute left-1/2 top-[10%] h-[80%] w-px -translate-x-1/2 bg-[#C4D8D3]" />

      {/* Left / right areas */}

      <div className="absolute left-[8%] top-[42%] rounded-full bg-[#D8EAE6] px-3 py-1 text-[10px] text-[#5C7771]">
        LEFT
      </div>

      <div className="absolute right-[8%] top-[42%] rounded-full bg-[#D8EAE6] px-3 py-1 text-[10px] text-[#5C7771]">
        RIGHT
      </div>

      {/* Lesions */}

      {spots.map((spot) => (
        <div
          key={spot.id}
          className="absolute"
          style={{
            left: spot.x,
            top: spot.y,
          }}
        >
          <div
            className={`
              flex h-8 w-8 -translate-x-1/2 -translate-y-1/2
              items-center justify-center rounded-full
              text-xs font-bold
              transition
              ${
                spot.completed
                  ? "bg-[#7FB4A8] text-white opacity-50"
                  : spot.active
                    ? "animate-pulse bg-[#D95F5F] text-white ring-8 ring-[#D95F5F]/20"
                    : "bg-[#E9A3A3] text-white"
              }
            `}
          >
            {spot.id}
          </div>
        </div>
      ))}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-medium text-[#4C6761] shadow">
        1 / 5 targets
      </div>
    </div>
  );
}

export default BackMap;
