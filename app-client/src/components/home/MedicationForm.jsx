import { Plus } from "lucide-react";
import { useState } from "react";

import Card from "../common/Card";
import Button from "../common/Button";

function MedicationForm({ type, medications, setMedications }) {
  const isTopical = type === "topical";

  const [form, setForm] = useState({
    name: "",
    frequency: 1,
    time: "08:00",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addMedication = () => {
    if (!form.name.trim()) return;

    const newMedication = {
      id: Date.now(),
      name: form.name.trim(),
      frequency: form.frequency,
      time: form.time,
      type,
    };

    setMedications([...medications, newMedication]);

    // Reset form
    setForm({
      name: "",
      frequency: 1,
      time: "08:00",
    });
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#214D46]">
          {isTopical ? "Thuốc cần bôi" : "Thuốc cần uống"}
        </h3>

        <p className="mt-1 text-sm text-[#71827E]">
          Thêm thuốc theo chỉ định của bác sĩ.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Medicine name */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#38534E]">
            Tên thuốc
          </label>

          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={
              isTopical
                ? "Ví dụ: Ketoconazole cream"
                : "Ví dụ: Ketoconazole tablet"
            }
            className="
              w-full rounded-xl
              border border-[#D6E4E1]
              bg-white px-4 py-3
              text-sm
              outline-none
              transition
              placeholder:text-[#A5B2AF]
              focus:border-[#2D7A6D]
              focus:ring-2
              focus:ring-[#2D7A6D]/10
            "
          />
        </div>

        {/* Frequency + time */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Frequency */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#38534E]">
              Số lần / ngày
            </label>

            <select
              value={form.frequency}
              onChange={(e) =>
                handleChange("frequency", Number(e.target.value))
              }
              className="
                w-full rounded-xl
                border border-[#D6E4E1]
                bg-white px-4 py-3
                text-sm
                outline-none
                transition
                focus:border-[#2D7A6D]
                focus:ring-2
                focus:ring-[#2D7A6D]/10
              "
            >
              {[1, 2, 3, 4].map((num) => (
                <option key={num} value={num}>
                  {num} lần / ngày
                </option>
              ))}
            </select>
          </div>

          {/* Time */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#38534E]">
              Khung giờ
            </label>

            <input
              type="time"
              value={form.time}
              onChange={(e) => handleChange("time", e.target.value)}
              className="
                w-full rounded-xl
                border border-[#D6E4E1]
                bg-white px-4 py-3
                text-sm
                outline-none
                transition
                focus:border-[#2D7A6D]
                focus:ring-2
                focus:ring-[#2D7A6D]/10
              "
            />
          </div>
        </div>

        {/* Add button */}
        <Button
          type="button"
          onClick={addMedication}
          variant="secondary"
          className="
            flex w-full
            items-center
            justify-center
            gap-2
          "
        >
          <Plus size={18} />
          Thêm thuốc
        </Button>
      </div>
    </Card>
  );
}

export default MedicationForm;
