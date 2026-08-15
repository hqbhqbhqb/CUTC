import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  AudioLines,
  CheckCircle2,
  CircleStop,
  Monitor,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Smartphone,
  SunMedium,
  X,
} from "lucide-react";

import CameraView from "../components/assistant/CameraView";
import BackMap from "../components/assistant/BackMap";
import AIGuidance from "../components/assistant/AIGuidance";
import TargetProgress from "../components/assistant/TargetProgress";
import PhoneCameraPairing from "../components/assistant/PhoneCameraPairing";
import Button from "../components/common/Button";
import ProgressBar from "../components/common/ProgressBar";
import { applyBrushCoverage, distance, getDirection, getNextCoveragePoint } from "../lib/vision";
import { useApp } from "../store/useApp";

const phaseText = {
  idle: "Ready to begin",
  initializing: "Starting the camera and MediaPipe...",
  waiting: "Turn around and keep your shoulders and hips in frame",
  scanning: "Hold still while the treatment areas are scanned...",
  guiding: "Guiding your index finger to the active target",
  completed: "All targets completed",
  error: "Unable to continue",
};

const conditionCopy = {
  pityriasis: { name: "pityriasis versicolor", result: "possible pale areas" },
  ringworm: { name: "ringworm", result: "possible treatment areas" },
  acne: { name: "back acne", result: "possible red areas" },
};

function mergeScanCandidates(current, spots) {
  const next = current.map((candidate) => ({ ...candidate }));
  spots.forEach((spot) => {
    const match = next.find((candidate) => distance(candidate, spot) < Math.max(0.032, spot.radiusX || 0, spot.radiusY || 0));
    if (match) {
      const sightings = match.sightings + 1;
      match.x = (match.x * match.sightings + spot.x) / sightings;
      match.y = (match.y * match.sightings + spot.y) / sightings;
      match.radiusX = Math.max(match.radiusX || 0, spot.radiusX || 0);
      match.radiusY = Math.max(match.radiusY || 0, spot.radiusY || 0);
      match.cells = spot.cells;
      match.coveredCells = spot.coveredCells;
      match.score = Math.max(match.score || 0, spot.score || 0);
      match.sightings = sightings;
    } else {
      next.push({ ...spot, sightings: 1 });
    }
  });
  return next;
}

function AIAssistant() {
  const { disease, medications, completeTopicalSession } = useApp();
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [backVisible, setBackVisible] = useState(false);
  const [personVisible, setPersonVisible] = useState(false);
  const [backFacing, setBackFacing] = useState(false);
  const [scanSpots, setScanSpots] = useState([]);
  const [targets, setTargets] = useState([]);
  const [activeTargetId, setActiveTargetId] = useState(null);
  const [finger, setFinger] = useState(null);
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [sensitivity, setSensitivity] = useState(1);
  const [cameraSource, setCameraSource] = useState("local");
  const [remoteStream, setRemoteStream] = useState(null);
  const [illuminationMode, setIlluminationMode] = useState(false);
  const [averageLuma, setAverageLuma] = useState(100);
  const phaseRef = useRef(phase);
  const scanStartedRef = useRef(0);
  const scanCandidatesRef = useRef([]);
  const scanFrameCountRef = useRef(0);
  const lastScanAnalysisIdRef = useRef(0);
  const lastFingerRef = useRef(null);
  const lastCoverageFrameRef = useRef(0);
  const lastBeepAtRef = useRef(0);
  const backLostAtRef = useRef(0);
  const latestFingerRef = useRef(null);
  const completionLockRef = useRef(false);
  const audioContextRef = useRef(null);
  const speechModeRef = useRef(null);
  const activeTargetIdRef = useRef(activeTargetId);
  const targetsRef = useRef(targets);

  const activeTarget = targets.find((target) => target.id === activeTargetId) || null;
  const guidancePoint = activeTarget?.nextPoint || getNextCoveragePoint(activeTarget, finger);
  const guidance = getDirection(finger, guidancePoint);
  const selectedCondition = conditionCopy[disease] || conditionCopy.pityriasis;

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { activeTargetIdRef.current = activeTargetId; }, [activeTargetId]);
  useEffect(() => { targetsRef.current = targets; }, [targets]);

  const speak = useCallback((text, mode = "message") => {
    if (!("speechSynthesis" in window) || !text) return;
    if (mode !== "message" && speechModeRef.current === "message") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.96;
    utterance.volume = 0.95;
    const englishVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang?.toLowerCase().startsWith("en-us"));
    if (englishVoice) utterance.voice = englishVoice;
    speechModeRef.current = mode;
    utterance.onend = () => {
      if (speechModeRef.current === mode) speechModeRef.current = null;
    };
    utterance.onerror = utterance.onend;
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

  const resetTouch = useCallback((resetProgress = false) => {
    lastFingerRef.current = null;
    lastCoverageFrameRef.current = 0;
    setHolding(false);
    if (resetProgress) setHoldProgress(0);
  }, []);

  const completeTarget = useCallback((targetId) => {
    if (completionLockRef.current) return;
    completionLockRef.current = true;
    resetTouch(true);
    setTargets((currentTargets) => {
      const nextTargets = currentTargets.map((target) => target.id === targetId ? { ...target, completed: true } : target);
      const remaining = nextTargets.find((target) => !target.completed);
      if (remaining) {
        setActiveTargetId(remaining.id);
        activeTargetIdRef.current = remaining.id;
        window.setTimeout(() => {
          completionLockRef.current = false;
          speak(`Target ${targetId} is complete. Moving to target ${remaining.id}.`);
        }, 450);
      } else {
        setActiveTargetId(null);
        activeTargetIdRef.current = null;
        setPhase("completed");
        phaseRef.current = "completed";
        completeTopicalSession();
        speak("All treatment areas are complete. This topical medication task has been recorded.");
      }
      targetsRef.current = nextTargets;
      return nextTargets;
    });
  }, [completeTopicalSession, resetTouch, speak]);

  const handleFrame = useCallback((frame) => {
    setBackVisible(frame.backVisible);
    setPersonVisible(frame.personVisible);
    setBackFacing(frame.backFacing);
    setFinger(frame.finger);
    latestFingerRef.current = frame.finger;
    setScanSpots(frame.backVisible ? frame.spots : []);
    if (Number.isFinite(frame.averageLuma) && frame.averageLuma > 0) setAverageLuma(frame.averageLuma);

    if (phaseRef.current === "guiding" && !frame.backVisible) {
      if (!backLostAtRef.current) backLostAtRef.current = performance.now();
      if (performance.now() - backLostAtRef.current > 3800) {
        setTargets([]);
        targetsRef.current = [];
        setActiveTargetId(null);
        activeTargetIdRef.current = null;
        setPhase("waiting");
        phaseRef.current = "waiting";
        speak("I can no longer see your back clearly. Turn around and place your shoulders and hips inside the frame.");
      }
      resetTouch();
      return;
    }
    if (frame.backVisible) backLostAtRef.current = 0;

    if (phaseRef.current === "initializing" && frame.backVisible) {
      setPhase("scanning");
      phaseRef.current = "scanning";
      scanStartedRef.current = performance.now();
      scanCandidatesRef.current = [];
      scanFrameCountRef.current = 0;
      lastScanAnalysisIdRef.current = 0;
    }
    if (phaseRef.current === "waiting" && frame.backVisible) {
      setPhase("scanning");
      phaseRef.current = "scanning";
      scanStartedRef.current = performance.now();
      scanCandidatesRef.current = [];
      scanFrameCountRef.current = 0;
      lastScanAnalysisIdRef.current = 0;
    }
    if (phaseRef.current === "scanning") {
      if (!frame.backVisible) {
        setPhase("waiting");
        phaseRef.current = "waiting";
        scanStartedRef.current = 0;
      } else {
        if (frame.analysisId && frame.analysisId !== lastScanAnalysisIdRef.current) {
          lastScanAnalysisIdRef.current = frame.analysisId;
          scanFrameCountRef.current += 1;
          scanCandidatesRef.current = mergeScanCandidates(scanCandidatesRef.current, frame.spots);
        }
        const readyToFinalize = performance.now() - scanStartedRef.current > 2600 && scanFrameCountRef.current >= 5;
        const stableSpots = scanCandidatesRef.current.filter((spot) => spot.sightings >= 2);
        if (!readyToFinalize || stableSpots.length === 0) return;
        const ordered = stableSpots
          .sort((a, b) => (a.x < 0.5 ? 0 : 1) - (b.x < 0.5 ? 0 : 1) || a.y - b.y)
          .slice(0, 30)
          .map((spot, index) => ({ ...spot, id: index + 1, completed: false, sightings: undefined }));
        setTargets(ordered);
        targetsRef.current = ordered;
        setActiveTargetId(ordered[0].id);
        activeTargetIdRef.current = ordered[0].id;
        setPhase("guiding");
        phaseRef.current = "guiding";
        speak(`${ordered.length} possible treatment areas were found. Starting with target one.`);
      }
    }

    if (phaseRef.current !== "guiding" || !frame.backVisible || !frame.finger) {
      resetTouch();
      return;
    }

    const target = targetsRef.current.find((item) => item.id === activeTargetIdRef.current);
    if (!target) return;
    const now = performance.now();
    const deltaMs = lastCoverageFrameRef.current ? now - lastCoverageFrameRef.current : 0;
    const motionDelta = lastFingerRef.current ? distance(lastFingerRef.current, frame.finger) : 0;
    const coverageResult = applyBrushCoverage(target, frame.finger, deltaMs, motionDelta);
    const updatedTarget = {
      ...coverageResult.target,
      nextPoint: getNextCoveragePoint(coverageResult.target, frame.finger),
    };
    const updatedTargets = targetsRef.current.map((item) => item.id === target.id ? updatedTarget : item);
    targetsRef.current = updatedTargets;
    setTargets(updatedTargets);
    setHolding(coverageResult.touching);
    const coverageRatio = updatedTarget.coverage;
    const contactRatio = Math.min(updatedTarget.contactMs / 3000, 1);
    const motionRatio = Math.min(updatedTarget.motion / 0.018, 1);
    setHoldProgress(Math.min(coverageRatio, contactRatio, motionRatio) * 100);
    if (coverageResult.touching && now - lastBeepAtRef.current >= 430) {
      beep();
      lastBeepAtRef.current = now;
    }
    lastFingerRef.current = frame.finger;
    lastCoverageFrameRef.current = now;
    if (coverageResult.justCompleted) completeTarget(target.id);
  }, [beep, completeTarget, resetTouch, speak]);

  useEffect(() => {
    if (phase !== "guiding" || holding) return undefined;
    const directionWords = {
      left: "left",
      right: "right",
      up: "up",
      down: "down",
    };
    const timer = window.setInterval(() => {
      const currentTarget = targetsRef.current.find((target) => target.id === activeTargetIdRef.current);
      const nextPoint = getNextCoveragePoint(currentTarget, latestFingerRef.current);
      const direction = getDirection(latestFingerRef.current, nextPoint);
      if (directionWords[direction.key]) speak(directionWords[direction.key], "direction");
    }, 800);
    return () => window.clearInterval(timer);
  }, [holding, phase, speak]);

  useEffect(() => {
    if (phase !== "guiding" || holding) return;
    if (guidance.key === "apply") speak("Apply here and rub gently over the highlighted area.", "guidance");
    if (guidance.key === "waiting") speak("Place your index finger inside the camera frame.", "guidance");
  }, [guidance.key, holding, phase, speak]);

  const start = () => {
    setError("");
    setTargets([]);
    setScanSpots([]);
    scanCandidatesRef.current = [];
    scanFrameCountRef.current = 0;
    lastScanAnalysisIdRef.current = 0;
    setActiveTargetId(null);
    completionLockRef.current = false;
    lastBeepAtRef.current = 0;
    resetTouch(true);
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
    setPersonVisible(false);
    setBackFacing(false);
    setFinger(null);
    latestFingerRef.current = null;
    resetTouch(true);
    window.speechSynthesis?.cancel();
    speechModeRef.current = null;
  };

  const selectCameraSource = (source) => {
    if (source === cameraSource) return;
    stop();
    setRemoteStream(null);
    setIlluminationMode(false);
    setCameraSource(source);
  };

  const toggleIllumination = async () => {
    const next = !illuminationMode;
    setIlluminationMode(next);
    if (next) await document.documentElement.requestFullscreen?.().catch(() => {});
    else if (document.fullscreenElement) await document.exitFullscreen?.().catch(() => {});
  };

  const displayTargets = backVisible ? (targets.length ? targets : scanSpots) : [];
  const detectedCount = displayTargets.length;
  const overallProgress = targets.length
    ? (targets.reduce((sum, target) => sum + (target.completed ? 1 : target.coverage || 0), 0) / targets.length) * 100
    : 0;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#2d7a6d]">AI ASSISTANT · COMPUTER VISION</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173f38] sm:text-4xl">Camera-guided medication application</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#71827e]">MediaPipe confirms a back-facing pose and tracks the index fingertip. Local contrast analysis highlights possible {selectedCondition.name} areas for guidance only, not diagnosis.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#e8f4f1] px-4 py-2 text-xs font-bold text-[#2d7266]"><ShieldCheck size={16} /> {cameraSource === "phone" ? "Encrypted phone-to-desktop video" : "Video stays on this device"}</div>
      </div>

      {medications.filter((item) => item.type === "topical").length === 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#f0dfb8] bg-[#fff9eb] p-4 text-sm leading-6 text-[#715b2e]"><AlertTriangle size={20} className="mt-0.5 shrink-0" /> No topical medication has been added. You may test the camera, but no medication task will be completed.</div>
      )}

      <section className="mb-6 rounded-3xl border border-[#dce9e6] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d7a6d]">Camera source</p><h2 className="mt-1 text-lg font-bold text-[#193b35]">Choose the clearest fixed camera</h2><p className="mt-1 text-xs leading-5 text-[#71827e]">The phone rear camera is recommended for small or faint areas.</p></div>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f1f6f4] p-1.5">
            <button type="button" onClick={() => selectCameraSource("local")} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${cameraSource === "local" ? "bg-white text-[#247568] shadow-sm" : "text-[#71827e]"}`}><Monitor size={17} /> This device</button>
            <button type="button" onClick={() => selectCameraSource("phone")} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${cameraSource === "phone" ? "bg-white text-[#247568] shadow-sm" : "text-[#71827e]"}`}><Smartphone size={17} /> Phone rear</button>
          </div>
        </div>
      </section>

      <PhoneCameraPairing
        active={cameraSource === "phone"}
        onStream={setRemoteStream}
        onDisconnected={() => {
          setRemoteStream(null);
          setIlluminationMode(false);
          if (started) stop();
        }}
      />

      <div className={`grid gap-6 lg:grid-cols-[1.4fr_0.9fr] ${cameraSource === "phone" ? "mt-6" : ""}`}>
        <div className="space-y-5">
          <CameraView active={started && (cameraSource === "local" || Boolean(remoteStream))} externalStream={cameraSource === "phone" ? remoteStream : null} highDetail={phase === "scanning"} targets={targets} activeTargetId={activeTargetId} sensitivity={sensitivity} condition={disease} onFrame={handleFrame} onReady={() => { if (phaseRef.current === "initializing") { setPhase("waiting"); phaseRef.current = "waiting"; speak("The camera is ready. Turn around and place your shoulders and hips near the center of the frame."); } }} onError={(message) => { setError(message); setPhase("error"); phaseRef.current = "error"; }} />

          <div className="rounded-2xl border border-[#dce9e6] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${phase === "completed" ? "bg-[#e3f5ee] text-[#278071]" : phase === "error" ? "bg-[#fff0ef] text-[#bc554c]" : "bg-[#eaf5f2] text-[#2d7a6d]"}`}>{phase === "completed" ? <CheckCircle2 size={22} /> : <ScanLine size={22} className={started && phase !== "error" ? "animate-pulse" : ""} />}</div>
              <div className="min-w-0 flex-1"><h3 className="font-bold text-[#234c45]">System status</h3><p className="mt-1 text-sm text-[#71827e]">{phaseText[phase]}</p>{started && <div className="mt-2 space-y-1 text-xs font-semibold text-[#5f7772]"><p>{personVisible ? "✓ Shoulders and hips detected" : "○ Full torso not detected"}</p><p>{backFacing ? "✓ Back-facing pose confirmed" : "○ Face directly away from the camera"}</p><p>{backVisible ? "✓ Back region is ready to scan" : "○ No valid back region yet"} · {finger ? "✓ Index finger detected" : "○ Index finger not detected"}</p></div>}</div>
            </div>
            {error && <p className="mt-4 rounded-xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a94c45]">{error}</p>}
          </div>

          <div className="rounded-2xl border border-[#dce9e6] bg-white p-5">
            <label className="flex items-center justify-between text-sm font-semibold text-[#38534e]"><span>Detection sensitivity</span><span>{sensitivity.toFixed(1)}×</span></label>
            <input type="range" min="0.6" max="1.5" step="0.1" value={sensitivity} onChange={(event) => setSensitivity(Number(event.target.value))} className="mt-3 w-full accent-[#2d7a6d]" />
            <p className="mt-2 text-xs leading-5 text-[#82928e]">Lower it if lighting creates noise. Raise it if small pale areas are difficult to detect.</p>
          </div>

          <div className="flex gap-3">
            {!started ? <Button onClick={start} disabled={cameraSource === "phone" && !remoteStream} className="flex flex-1 items-center justify-center gap-2"><AudioLines size={19} /> {cameraSource === "phone" && !remoteStream ? "Connect phone first" : "Start camera and voice"}</Button> : <Button onClick={stop} variant="outline" className="flex flex-1 items-center justify-center gap-2"><CircleStop size={19} /> Stop camera</Button>}
            {(phase === "completed" || phase === "error") && <Button onClick={() => { stop(); window.setTimeout(start, 80); }} variant="secondary" className="flex items-center gap-2"><RotateCcw size={18} /> Restart</Button>}
          </div>
          {cameraSource === "phone" && remoteStream && (
            <button type="button" onClick={toggleIllumination} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7e7e3] bg-white px-5 py-3 text-sm font-bold text-[#315d56] shadow-sm hover:bg-[#f4f8f7]"><SunMedium size={18} /> {illuminationMode ? "Exit illumination screen" : "Open adaptive white illumination screen"}</button>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-[#193b35] p-6 text-white shadow-[0_18px_50px_rgba(25,59,53,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">Detection result</p>
            <div className="mt-3 flex items-end gap-2"><span className="text-5xl font-bold">{detectedCount}</span><span className="pb-2 text-sm text-white/65">{selectedCondition.result}</span></div>
            <div className="mt-5"><ProgressBar value={overallProgress} /></div>
            <p className="mt-3 text-xs text-white/60">{phase === "guiding" ? `Targeting area #${activeTargetId}` : phase === "completed" ? "100% complete" : "Place your back in frame to begin scanning"}</p>
          </div>
          <BackMap targets={displayTargets} activeTargetId={activeTargetId} />
          <AIGuidance guidance={guidance} targetNumber={activeTargetId} holding={holding} holdProgress={holdProgress} coverageProgress={(activeTarget?.coverage || 0) * 100} contactProgress={Math.min((activeTarget?.contactMs || 0) / 3000, 1) * 100} handVisible={Boolean(finger)} phase={phase} />
          <TargetProgress targets={targets} activeTargetId={activeTargetId} />
          <div className="flex items-start gap-3 rounded-xl bg-[#eaf5f2] p-4"><CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#2d7a6d]" /><p className="text-sm leading-6 text-[#45655f]">After every target is completed, the app marks the next topical medication task in today's schedule as complete.</p></div>
        </div>
      </div>
      {illuminationMode && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-5 transition-colors" style={{ backgroundColor: averageLuma < 75 ? "#ffffff" : averageLuma < 125 ? "#f4f7f6" : "#dfe6e4" }}>
          <div className="flex max-w-lg items-center gap-3 rounded-2xl border border-black/10 bg-white/90 p-3 text-[#234c45] shadow-xl backdrop-blur">
            <SunMedium size={20} className="shrink-0 text-[#2d7a6d]" />
            <p className="text-xs leading-5"><span className="font-bold">Adaptive illumination is active.</span> The screen adjusts between soft white levels from the measured skin brightness. Voice guidance continues.</p>
            <button type="button" onClick={toggleIllumination} className="shrink-0 rounded-xl bg-[#193b35] p-2.5 text-white" aria-label="Exit illumination screen"><X size={18} /></button>
          </div>
        </div>
      )}
    </main>
  );
}

export default AIAssistant;
