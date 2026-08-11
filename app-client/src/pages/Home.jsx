import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import PageContainer from "../components/layout/PageContainer";

import DiseaseSelector from "../components/home/DiseaseSelector";
import MedicationForm from "../components/home/MedicationForm";
import MedicationList from "../components/home/MedicationList";
import ApplicationGuide from "../components/home/ApplicationGuide";

import Button from "../components/common/Button";

function Home() {
  const navigate = useNavigate();

  const [disease, setDisease] = useState("");

  const [topicalMedications, setTopicalMedications] = useState([]);

  const [oralMedications, setOralMedications] = useState([]);

  const removeTopicalMedication = (id) => {
    setTopicalMedications((prev) => prev.filter((item) => item.id !== id));
  };

  const removeOralMedication = (id) => {
    setOralMedications((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStart = () => {
    navigate("/assistant");
  };

  return (
    <main className="min-w-0 overflow-x-hidden">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="w-full min-w-0 border-b border-[#DCE9E6] bg-white">
        <PageContainer className="py-12 sm:py-16 lg:py-24">
          <div className="min-w-0 max-w-4xl">
            {/* Privacy badge */}

            <div
              className="
                mb-6
                inline-flex
                max-w-full
                items-center
                gap-2
                rounded-full
                bg-[#EAF5F2]
                px-3
                py-2
                text-xs
                font-medium
                text-[#2D7A6D]
                sm:px-4
                sm:text-sm
              "
            >
              <ShieldCheck size={16} className="shrink-0" />

              <span className="min-w-0 truncate">
                Dữ liệu người dùng được bảo mật tuyệt đối
              </span>
            </div>

            {/* Heading */}

            <h1
              className="
                max-w-full
                break-words
                text-3xl
                font-bold
                leading-tight
                tracking-tight
                text-[#193B35]
                sm:text-5xl
                lg:text-6xl
              "
            >
              Đồng hành cùng bạn
              <br className="hidden sm:block" /> trong quá trình chăm sóc da.
            </h1>

            {/* Description */}

            <p
              className="
                mt-5
                max-w-2xl
                break-words
                text-sm
                leading-6
                text-[#687B76]
                sm:mt-6
                sm:text-lg
                sm:leading-7
              "
            >
              Theo dõi lịch thuốc, ghi nhận tiến độ và hỗ trợ bạn thực hiện các
              bước chăm sóc theo chỉ định của bác sĩ.
            </p>
          </div>
        </PageContainer>
      </section>

      {/* =====================================================
          TREATMENT SETUP
      ====================================================== */}

      <section className="min-w-0">
        <PageContainer className="min-w-0 py-10 sm:py-12 lg:py-16">
          <div className="min-w-0 space-y-10">
            {/* Disease */}

            <section className="min-w-0">
              <DiseaseSelector selected={disease} setSelected={setDisease} />
            </section>

            {/* =================================================
                MEDICATIONS
            ================================================== */}

            <section className="min-w-0">
              <div className="mb-6 min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-[#2D7A6D] sm:text-sm">
                  Treatment plan
                </p>

                <h2 className="mt-1 break-words text-2xl font-bold text-[#193B35]">
                  Lịch sử dụng thuốc
                </h2>

                <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-[#71827E]">
                  Thêm các loại thuốc và thời gian sử dụng theo chỉ định của bác
                  sĩ.
                </p>
              </div>

              {/* Medication columns */}

              <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
                {/* TOPICAL */}

                <div className="min-w-0 space-y-4">
                  <MedicationForm
                    type="topical"
                    medications={topicalMedications}
                    setMedications={setTopicalMedications}
                  />

                  <MedicationList
                    type="topical"
                    medications={topicalMedications}
                    onRemove={removeTopicalMedication}
                  />
                </div>

                {/* ORAL */}

                <div className="min-w-0 space-y-4">
                  <MedicationForm
                    type="oral"
                    medications={oralMedications}
                    setMedications={setOralMedications}
                  />

                  <MedicationList
                    type="oral"
                    medications={oralMedications}
                    onRemove={removeOralMedication}
                  />
                </div>
              </div>
            </section>

            {/* =================================================
                APPLICATION GUIDE
            ================================================== */}

            <section className="min-w-0">
              <ApplicationGuide />
            </section>

            {/* =================================================
                START
            ================================================== */}

            <section className="flex justify-center pt-2">
              <Button
                onClick={handleStart}
                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-3
                  px-8
                  sm:w-auto
                "
              >
                Bắt đầu
                <ArrowRight size={19} />
              </Button>
            </section>
          </div>
        </PageContainer>
      </section>
    </main>
  );
}

export default Home;
