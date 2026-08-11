import { Clock3, Droplets, Pill, Trash2 } from "lucide-react";
import Card from "../common/Card";

function MedicationList({ medications, type, onRemove }) {
  const isTopical = type === "topical";

  if (medications.length === 0) {
    return (
      <Card className="p-6">
        <div className="py-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF5F2] text-[#2D7A6D]">
            {isTopical ? <Droplets size={22} /> : <Pill size={22} />}
          </div>

          <p className="mt-3 text-sm font-medium text-[#526A65]">
            Chưa có thuốc nào
          </p>

          <p className="mt-1 text-xs text-[#879691]">
            Các thuốc bạn thêm sẽ xuất hiện ở đây.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-5">
        <h3 className="text-lg font-bold">
          {isTopical ? "Danh sách thuốc bôi" : "Danh sách thuốc uống"}
        </h3>

        <p className="mt-1 text-sm text-[#71827E]">
          {medications.length} loại thuốc
        </p>
      </div>

      <div className="space-y-3">
        {medications.map((medication) => (
          <div
            key={medication.id}
            className="flex items-center gap-4 rounded-xl border border-[#E1ECE9] p-4"
          >
            <div
              className={`
                flex h-11 w-11 shrink-0 items-center
                justify-center rounded-xl
                ${
                  isTopical
                    ? "bg-[#EAF5F2] text-[#2D7A6D]"
                    : "bg-[#EEF2FA] text-[#6578A7]"
                }
              `}
            >
              {isTopical ? <Droplets size={20} /> : <Pill size={20} />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {medication.name}
              </p>

              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#83918D]">
                <span>{medication.frequency} lần / ngày</span>

                <span className="flex items-center gap-1">
                  <Clock3 size={13} />
                  {medication.times.join(" · ")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemove(medication.id)}
              className="shrink-0 rounded-lg p-2 text-[#B85C5C] transition hover:bg-[#FBEAEA]"
              aria-label={`Xóa ${medication.name}`}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default MedicationList;
