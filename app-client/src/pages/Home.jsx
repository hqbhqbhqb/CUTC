import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Clock3,
  Droplets,
  LockKeyhole,
  Pencil,
  Pill,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import PageContainer from "../components/layout/PageContainer";
import DiseaseSelector from "../components/home/DiseaseSelector";
import MedicationForm from "../components/home/MedicationForm";
import MedicationList from "../components/home/MedicationList";
import ApplicationGuide from "../components/home/ApplicationGuide";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { useApp } from "../store/useApp";

function TodayPlan({ tasks, onToggle, onEdit }) {
  const completed = tasks.filter((task) => task.completed).length;
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#e2ece9] bg-[#f9fcfb] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#278071]">Lịch hôm nay</p>
          <h2 className="mt-2 text-2xl font-bold text-[#173f38]">{completed}/{tasks.length} task đã hoàn thành</h2>
          <p className="mt-1 text-sm text-[#71827e]">Chạm vào từng task sau khi dùng thuốc đúng chỉ định.</p>
        </div>
        <Button variant="outline" onClick={onEdit} className="flex items-center justify-center gap-2">
          <Pencil size={17} /> Chỉnh phác đồ
        </Button>
      </div>
      <div className="divide-y divide-[#e7efed] px-6">
        {tasks.map((task) => (
          <button key={task.id} type="button" onClick={() => onToggle(task.id)} className="flex w-full items-center gap-4 py-4 text-left">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${task.type === "topical" ? "bg-[#e8f4f1] text-[#26796c]" : "bg-[#eef1fb] text-[#6075a7]"}`}>
              {task.type === "topical" ? <Droplets size={20} /> : <Pill size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-bold ${task.completed ? "text-[#82908d] line-through" : "text-[#274a44]"}`}>{task.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-[#82908d]"><Clock3 size={13} /> {task.time} · {task.type === "topical" ? "Thuốc bôi" : "Thuốc uống"}</p>
            </div>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${task.completed ? "border-[#278071] bg-[#278071] text-white" : "border-[#cbdad6] text-transparent"}`}><Check size={15} /></div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function Home() {
  const navigate = useNavigate();
  const {
    user,
    disease,
    setDisease,
    medications,
    addMedication,
    removeMedication,
    tasks,
    toggleTask,
  } = useApp();
  const [editingPlan, setEditingPlan] = useState(medications.length === 0);
  const topicalMedications = medications.filter((item) => item.type === "topical");
  const oralMedications = medications.filter((item) => item.type === "oral");

  return (
    <main className="min-w-0 overflow-x-hidden">
      <section className="relative overflow-hidden border-b border-[#dce9e6] bg-[#f7fbf9]">
        <div className="absolute -right-32 -top-40 h-[460px] w-[460px] rounded-full bg-[#dff2ec] blur-3xl" />
        <PageContainer className="relative py-12 sm:py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cfe6df] bg-white px-4 py-2 text-xs font-bold text-[#247568] shadow-sm sm:text-sm">
                <ShieldCheck size={17} /> Dữ liệu camera được xử lý ngay trên thiết bị
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-[#153e37] sm:text-5xl lg:text-6xl">
                Tự bôi thuốc đúng chỗ, ngay cả khi bạn chỉ có một mình.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#637a75] sm:text-lg">
                DermaCare dùng camera để định vị vùng da cần chăm sóc, hướng dẫn ngón tay bằng giọng nói và ghi nhận lịch thuốc theo chỉ định bác sĩ.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => document.getElementById("treatment")?.scrollIntoView()} className="flex items-center justify-center gap-2 px-6">
                  Thiết lập điều trị <ArrowRight size={18} />
                </Button>
                {!user && <Link to="/register" className="flex items-center justify-center rounded-xl border border-[#bcd2cd] bg-white px-6 py-3 text-sm font-semibold text-[#315d56] hover:bg-[#f2f8f6]">Tạo tài khoản miễn phí</Link>}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_30px_80px_rgba(26,75,66,0.14)] backdrop-blur">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs font-bold tracking-[0.14em] text-[#278071]">DERMACARE VISION</p><p className="mt-1 font-bold text-[#173f38]">Hỗ trợ bôi thuốc theo thời gian thực</p></div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f3ef] text-[#247568]"><Sparkles size={24} /></div>
                </div>
                <div className="mt-6 aspect-[4/3] rounded-3xl bg-[#183c36] p-5">
                  <div className="relative h-full overflow-hidden rounded-[42%] border border-white/30 bg-gradient-to-b from-[#f0c7ad] to-[#bd8068]">
                    <div className="absolute left-1/2 top-[12%] h-[76%] w-px bg-white/20" />
                    {[[38,28],[61,38],[43,56],[66,64]].map(([x,y], index) => <span key={index} className={`absolute h-4 w-4 rounded-full border-2 ${index === 0 ? "animate-pulse border-white bg-[#ef685d] ring-8 ring-[#ef685d]/30" : "border-white/80 bg-white/30"}`} style={{ left: `${x}%`, top: `${y}%` }} />)}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-medium text-white">Target 1 · Sang phải →</div>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#edf7f4] p-4 text-sm font-semibold text-[#32665d]"><LockKeyhole size={18} /> Không lưu hoặc gửi hình ảnh camera</div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <section id="treatment">
        <PageContainer className="py-12 lg:py-16">
          <div className="space-y-10">
            <DiseaseSelector selected={disease} setSelected={setDisease} />

            {tasks.length > 0 && !editingPlan ? (
              <TodayPlan tasks={tasks} onToggle={toggleTask} onEdit={() => setEditingPlan(true)} />
            ) : (
              <section>
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d7a6d]">Phác đồ của bác sĩ</p>
                    <h2 className="mt-2 text-2xl font-bold text-[#193b35]">Thiết lập lịch sử dụng thuốc</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71827e]">Chỉ nhập thuốc và thời gian theo đúng chỉ định. Có thể thêm nhiều loại thuốc.</p>
                  </div>
                  {medications.length > 0 && <Button variant="outline" onClick={() => setEditingPlan(false)}>Xong</Button>}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <MedicationForm type="topical" onAdd={addMedication} />
                    <MedicationList type="topical" medications={topicalMedications} onRemove={removeMedication} />
                  </div>
                  <div className="space-y-4">
                    <MedicationForm type="oral" onAdd={addMedication} />
                    <MedicationList type="oral" medications={oralMedications} onRemove={removeMedication} />
                  </div>
                </div>
              </section>
            )}

            <ApplicationGuide />
            <section className="flex flex-col items-center pt-2 text-center">
              <Button onClick={() => navigate("/assistant")} disabled={topicalMedications.length === 0} className="flex w-full items-center justify-center gap-3 px-8 sm:w-auto">
                Mở AI Assistant <ArrowRight size={19} />
              </Button>
              {topicalMedications.length === 0 && <p className="mt-3 text-xs text-[#8a9995]">Hãy thêm ít nhất một loại thuốc bôi trước khi bắt đầu.</p>}
            </section>
          </div>
        </PageContainer>
      </section>
    </main>
  );
}

export default Home;
