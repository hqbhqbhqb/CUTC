import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  AudioLines,
  CheckCircle2,
  CircleStop,
  RotateCcw,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

import CameraView from "../components/assistant/CameraView";
import BackMap from "../components/assistant/BackMap";
import AIGuidance from "../components/assistant/AIGuidance";
import TargetProgress from "../components/assistant/TargetProgress";
import Button from "../components/common/Button";
import ProgressBar from "../components/common/ProgressBar";
import { distance, getDirection } from "../lib/vision";
import { useApp } from "../store/useApp";

const phaseText = {
  idle: "Sẵn sàng bắt đầu",
  initializing: "Đang khởi tạo camera và MediaPipe...",
  waiting: "Đưa lưng vào vùng khung nét đứt",
  scanning: "Giữ yên để quét các vùng da sáng...",
  guiding: "Đang điều hướng ngón trỏ đến target",
  completed: "Đã hoàn thành tất cả target",
  error: "Không thể tiếp tục",
};

function AIAssistant() {
  const { medications, completeTopicalSession } = useApp();
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [backVisible, setBackVisible] = useState(false);
  const [scanSpots, setScanSpots] = useState([]);
  const [targets, setTargets] = useState([]);
  const [activeTargetId, setActiveTargetId] = useState(null);
  const [finger, setFinger] = useState(null);
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [sensitivity, setSensitivity] = useState(1);
  const phaseRef = useRef(phase);
  const scanStartedRef = useRef(0);
  const holdStartedRef = useRef(0);
  const holdMotionRef = useRef(0);
  const lastFingerRef = useRef(null);
  const latestFingerRef = useRef(null);
  const completionLockRef = useRef(false);
  const audioContextRef = useRef(null);
  const activeTargetIdRef = useRef(activeTargetId);
  const targetsRef = useRef(targets);

  const activeTarget = targets.find((target) => target.id === activeTargetId) || null;
  const guidance = getDirection(finger, activeTarget);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { activeTargetIdRef.current = activeTargetId; }, [activeTargetId]);
  useEffect(() => { targetsRef.current = targets; }, [targets]);

  const speak = useCallback((text, interrupt = true) => {
    if (!("speechSynthesis" in window) || !text) return;
    if (interrupt) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 1.05;
    utterance.volume = 0.95;
    window.speechSynthesis.speak(utterance);
  }, []);

  const beep = useCallback(() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioContextRef.current) audioContextRef.current = new AudioContextClass();
    const context = audioContextRef.current;
    if (context.state === "suspended") context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.13);
  }, []);

  const resetHold = useCallback(() => {
    holdStartedRef.current = 0;
    holdMotionRef.current = 0;
    lastFingerRef.current = null;
    setHolding(false);
    setHoldProgress(0);
  }, []);

  const completeTarget = useCallback((targetId) => {
    if (completionLockRef.current) return;
    completionLockRef.current = true;
    resetHold();
    setTargets((currentTargets) => {
      const nextTargets = currentTargets.map((target) => target.id === targetId ? { ...target, completed: true } : target);
      const remaining = nextTargets.find((target) => !target.completed);
      if (remaining) {
        setActiveTargetId(remaining.id);
        activeTargetIdRef.current = remaining.id;
        window.setTimeout(() => {
          completionLockRef.current = false;
          speak(`Đã xong target ${targetId}. Bắt đầu target ${remaining.id}.`);
        }, 450);
      } else {
        setActiveTargetId(null);
        activeTargetIdRef.current = null;
        setPhase("completed");
        phaseRef.current = "completed";
        completeTopicalSession();
        speak("Đã hoàn thành tất cả các vùng. Một lần bôi thuốc đã được ghi nhận.");
      }
      return nextTargets;
    });
  }, [completeTopicalSession, resetHold, speak]);

  const handleFrame = useCallback((frame) => {
    setBackVisible(frame.backVisible);
    setFinger(frame.finger);
    latestFingerRef.current = frame.finger;
    setScanSpots(frame.spots);

    if (phaseRef.current === "initializing" && frame.backVisible) {
      setPhase("scanning");
      phaseRef.current = "scanning";
      scanStartedRef.current = performance.now();
    }
    if (phaseRef.current === "waiting" && frame.backVisible) {
      setPhase("scanning");
      phaseRef.current = "scanning";
      scanStartedRef.current = performance.now();
    }
    if (phaseRef.current === "scanning") {
      if (!frame.backVisible) {
        setPhase("waiting");
        phaseRef.current = "waiting";
        scanStartedRef.current = 0;
      } else if (frame.spots.length > 0 && performance.now() - scanStartedRef.current > 1800) {
        const ordered = frame.spots.map((spot, index) => ({ ...spot, id: index + 1, completed: false }));
        setTargets(ordered);
        targetsRef.current = ordered;
        setActiveTargetId(ordered[0].id);
        activeTargetIdRef.current = ordered[0].id;
        setPhase("guiding");
        phaseRef.current = "guiding";
        speak(`Có tổng cộng ${ordered.length} vùng da sáng được phát hiện. Bắt đầu target thứ nhất.`);
      }
    }

    if (phaseRef.current !== "guiding" || !frame.backVisible || !frame.finger) {
      resetHold();
      return;
    }

    const target = targetsRef.current.find((item) => item.id === activeTargetIdRef.current);
    if (!target) return;
    const targetDistance = distance(frame.finger, target);
    const inside = targetDistance < Math.max(target.radius || 0.035, 0.04) + 0.025;
    if (!inside) {
      resetHold();
      return;
    }

    const now = performance.now();
    if (!holdStartedRef.current) {
      holdStartedRef.current = now;
      holdMotionRef.current = 0;
      lastFingerRef.current = frame.finger;
      setHolding(true);
      beep();
      return;
    }
    holdMotionRef.current += Math.min(distance(lastFingerRef.current, frame.finger), 0.02);
    lastFingerRef.current = frame.finger;
    const elapsed = now - holdStartedRef.current;
    const timeRatio = elapsed / 3500;
    const motionRatio = holdMotionRef.current / 0.012;
    setHoldProgress(Math.min(timeRatio, motionRatio, 1) * 100);
    if (elapsed >= 3500 && holdMotionRef.current >= 0.012) completeTarget(target.id);
  }, [beep, completeTarget, resetHold, speak]);

  useEffect(() => {
    if (!holding) return undefined;
    const timer = window.setInterval(beep, 430);
    return () => window.clearInterval(timer);
  }, [beep, holding]);

  useEffect(() => {
    if (phase !== "guiding" || holding) return undefined;
    const words = { left: "sang trái", right: "sang phải", up: "lên trên", down: "xuống dưới", waiting: "đưa ngón trỏ vào khung hình" };
    const timer = window.setInterval(() => {
      const currentTarget = targetsRef.current.find((target) => target.id === activeTargetIdRef.current);
      const direction = getDirection(latestFingerRef.current, currentTarget);
      if (words[direction.key]) speak(words[direction.key]);
    }, 650);
    return () => window.clearInterval(timer);
  }, [holding, phase, speak]);

  const start = () => {
    setError("");
    setTargets([]);
    setScanSpots([]);
    setActiveTargetId(null);
    completionLockRef.current = false;
    resetHold();
    setStarted(true);
    setPhase("initializing");
    phaseRef.current = "initializing";
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass && !audioContextRef.current) audioContextRef.current = new AudioContextClass();
  };

  const stop = () => {
    setStarted(false);
    setPhase("idle");
    phaseRef.current = "idle";
    setBackVisible(false);
    setFinger(null);
    latestFingerRef.current = null;
    resetHold();
    window.speechSynthesis?.cancel();
  };

  const displayTargets = targets.length ? targets : scanSpots;
  const detectedCount = displayTargets.length;
  const completedCount = targets.filter((target) => target.completed).length;
  const overallProgress = targets.length ? (completedCount / targets.length) * 100 : 0;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#2d7a6d]">AI ASSISTANT · COMPUTER VISION</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173f38] sm:text-4xl">Hướng dẫn bôi thuốc theo camera</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#71827e]">MediaPipe theo dõi đầu ngón trỏ; thuật toán màu tìm các vùng da sáng để hỗ trợ định vị, không dùng để chẩn đoán.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#e8f4f1] px-4 py-2 text-xs font-bold text-[#2d7266]"><ShieldCheck size={16} /> Video không rời thiết bị</div>
      </div>

      {medications.filter((item) => item.type === "topical").length === 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#f0dfb8] bg-[#fff9eb] p-4 text-sm leading-6 text-[#715b2e]"><AlertTriangle size={20} className="mt-0.5 shrink-0" /> Bạn chưa thiết lập thuốc bôi. Phiên camera vẫn chạy thử được nhưng sẽ không có task thuốc để đánh dấu.</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-5">
          <CameraView active={started} targets={targets} activeTargetId={activeTargetId} sensitivity={sensitivity} onFrame={handleFrame} onReady={() => { if (phaseRef.current === "initializing") { setPhase("waiting"); phaseRef.current = "waiting"; speak("Camera đã sẵn sàng. Hãy đưa lưng vào giữa khung hình."); } }} onError={(message) => { setError(message); setPhase("error"); phaseRef.current = "error"; }} />

          <div className="rounded-2xl border border-[#dce9e6] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${phase === "completed" ? "bg-[#e3f5ee] text-[#278071]" : phase === "error" ? "bg-[#fff0ef] text-[#bc554c]" : "bg-[#eaf5f2] text-[#2d7a6d]"}`}>{phase === "completed" ? <CheckCircle2 size={22} /> : <ScanLine size={22} className={started && phase !== "error" ? "animate-pulse" : ""} />}</div>
              <div className="min-w-0 flex-1"><h3 className="font-bold text-[#234c45]">Trạng thái hệ thống</h3><p className="mt-1 text-sm text-[#71827e]">{phaseText[phase]}</p>{started && <p className="mt-2 text-xs font-semibold text-[#5f7772]">{backVisible ? "✓ Đã thấy vùng lưng" : "○ Chưa xác nhận vùng lưng"} · {finger ? "✓ Đã thấy ngón trỏ" : "○ Chưa thấy ngón trỏ"}</p>}</div>
            </div>
            {error && <p className="mt-4 rounded-xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a94c45]">{error}</p>}
          </div>

          <div className="rounded-2xl border border-[#dce9e6] bg-white p-5">
            <label className="flex items-center justify-between text-sm font-semibold text-[#38534e]"><span>Độ nhạy vùng sáng</span><span>{sensitivity.toFixed(1)}×</span></label>
            <input type="range" min="0.6" max="1.5" step="0.1" value={sensitivity} onChange={(event) => setSensitivity(Number(event.target.value))} className="mt-3 w-full accent-[#2d7a6d]" />
            <p className="mt-2 text-xs leading-5 text-[#82928e]">Giảm nếu ánh sáng gây nhiều vùng giả; tăng khi vết khó được nhận diện.</p>
          </div>

          <div className="flex gap-3">
            {!started ? <Button onClick={start} className="flex flex-1 items-center justify-center gap-2"><AudioLines size={19} /> Bắt đầu và bật giọng nói</Button> : <Button onClick={stop} variant="outline" className="flex flex-1 items-center justify-center gap-2"><CircleStop size={19} /> Dừng camera</Button>}
            {(phase === "completed" || phase === "error") && <Button onClick={() => { stop(); window.setTimeout(start, 80); }} variant="secondary" className="flex items-center gap-2"><RotateCcw size={18} /> Làm lại</Button>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-[#193b35] p-6 text-white shadow-[0_18px_50px_rgba(25,59,53,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">Kết quả nhận diện</p>
            <div className="mt-3 flex items-end gap-2"><span className="text-5xl font-bold">{detectedCount}</span><span className="pb-2 text-sm text-white/65">vùng da sáng</span></div>
            <div className="mt-5"><ProgressBar value={overallProgress} /></div>
            <p className="mt-3 text-xs text-white/60">{phase === "guiding" ? `Đang target #${activeTargetId}` : phase === "completed" ? "Hoàn thành 100%" : "Đưa lưng vào khung để bắt đầu quét"}</p>
          </div>
          <BackMap targets={displayTargets} activeTargetId={activeTargetId} />
          <AIGuidance guidance={guidance} targetNumber={activeTargetId} holding={holding} holdProgress={holdProgress} handVisible={Boolean(finger)} phase={phase} />
          <TargetProgress targets={targets} activeTargetId={activeTargetId} />
          <div className="flex items-start gap-3 rounded-xl bg-[#eaf5f2] p-4"><CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#2d7a6d]" /><p className="text-sm leading-6 text-[#45655f]">Khi hoàn thành hết target, app tự đánh dấu một task bôi thuốc gần nhất trong lịch hôm nay.</p></div>
        </div>
      </div>
    </main>
  );
}

export default AIAssistant;
