import { Check } from "lucide-react";

import Card from "../common/Card";

function DiseaseSelector({ selected, setSelected }) {
  const diseases = [
    {
      id: "pityriasis",
      name: "Lang ben",
      description: "Hỗ trợ theo dõi các vùng da cần chăm sóc",
      icon: "●",
    },
    {
      id: "ringworm",
      name: "Hắc lào",
      description: "Theo dõi và nhắc nhở quá trình điều trị",
      icon: "○",
    },
    {
      id: "acne",
      name: "Mụn lưng",
      description: "Hỗ trợ phủ thuốc lên từng vùng mụn theo chỉ định",
      icon: "✦",
    },
  ];

  return (
    <div className="min-w-0">
      <h2 className="mb-4 break-words text-xl font-bold text-[#193B35]">
        Bạn đang điều trị vấn đề nào?
      </h2>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
        {diseases.map((disease) => {
          const active = selected === disease.id;

          return (
            <button
              key={disease.id}
              type="button"
              onClick={() => setSelected(disease.id)}
              className="min-w-0 text-left"
            >
              <Card
                className={`
                  relative
                  min-w-0
                  overflow-hidden
                  p-5
                  transition
                  ${
                    active
                      ? "border-[#2D7A6D] bg-[#F0F8F5]"
                      : "hover:border-[#B8D1CB]"
                  }
                `}
              >
                {active && (
                  <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#2D7A6D] text-white">
                    <Check size={14} />
                  </div>
                )}

                <div className="mb-4 text-3xl text-[#2D7A6D]">
                  {disease.icon}
                </div>

                <h3 className="font-semibold">{disease.name}</h3>

                <p className="mt-1 break-words text-sm text-[#71827E]">
                  {disease.description}
                </p>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DiseaseSelector;
