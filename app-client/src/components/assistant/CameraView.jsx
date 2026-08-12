import { useEffect, useRef, useState } from "react";
import { Camera, CameraIcon, RefreshCw, Scan, ShieldCheck } from "lucide-react";
import { FilesetResolver, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";
import Card from "../common/Card";
import { analyzeFrame, getPoseTorso } from "../../lib/vision";

function drawOverlay(canvas, analysis, finger, targets, activeTargetId) {
  const context = canvas.getContext("2d");
  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);

  if (analysis.torsoPolygon?.length) {
    context.strokeStyle = analysis.backVisible ? "rgba(80, 226, 186, .95)" : "rgba(255, 190, 92, .9)";
    context.fillStyle = analysis.backVisible ? "rgba(80, 226, 186, .06)" : "rgba(255, 190, 92, .06)";
    context.lineWidth = 3;
    context.setLineDash([10, 8]);
    context.beginPath();
    analysis.torsoPolygon.forEach((point, index) => {
      const x = point.x * width;
      const y = point.y * height;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    context.fill();
    context.stroke();
    context.setLineDash([]);
  } else {
    context.strokeStyle = "rgba(255,255,255,.55)";
    context.lineWidth = 2;
    context.setLineDash([10, 8]);
    context.strokeRect(width * 0.26, height * 0.12, width * 0.48, height * 0.76);
    context.setLineDash([]);
  }

  const visibleTargets = targets.length ? targets : analysis.spots;
  visibleTargets.forEach((target, index) => {
    const x = target.x * width;
    const y = target.y * height;
    const isActive = target.id === activeTargetId;

    target.cells?.forEach((cell, cellIndex) => {
      const covered = target.coveredCells?.[cellIndex];
      context.beginPath();
      context.arc(cell.x * width, cell.y * height, isActive ? 5 : 4, 0, Math.PI * 2);
      context.fillStyle = target.completed || covered
        ? "rgba(76, 224, 177, .78)"
        : isActive
          ? "rgba(255, 91, 82, .78)"
          : "rgba(255, 211, 103, .56)";
      context.fill();
    });

    context.strokeStyle = target.completed ? "#63d3b1" : isActive ? "#ff766c" : "#ffe39a";
    context.lineWidth = isActive ? 3 : 2;
    context.beginPath();
    context.ellipse(
      x,
      y,
      Math.max((target.radiusX || 0.025) * width, 10),
      Math.max((target.radiusY || 0.025) * height, 10),
      0,
      0,
      Math.PI * 2,
    );
    context.stroke();
    context.fillStyle = "white";
    context.font = "bold 12px Inter, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(target.id || index + 1), x, y);

    if (isActive && target.nextPoint && !target.completed) {
      context.beginPath();
      context.arc(target.nextPoint.x * width, target.nextPoint.y * height, 11, 0, Math.PI * 2);
      context.strokeStyle = "#65e6ff";
      context.lineWidth = 3;
      context.stroke();
    }
  });

  if (finger) {
    const x = finger.x * width;
    const y = finger.y * height;
    context.beginPath();
    context.arc(x, y, 9, 0, Math.PI * 2);
    context.fillStyle = "#65e6ff";
    context.fill();
    context.strokeStyle = "white";
    context.lineWidth = 3;
    context.stroke();
    context.beginPath();
    context.arc(x, y, 18, 0, Math.PI * 2);
    context.strokeStyle = "rgba(101, 230, 255, .55)";
    context.lineWidth = 2;
    context.stroke();
  }
}

function CameraView({ active, targets = [], activeTargetId, sensitivity, condition, onFrame, onReady, onError }) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const analysisCanvasRef = useRef(document.createElement("canvas"));
  const onFrameRef = useRef(onFrame);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const targetsRef = useRef(targets);
  const activeTargetRef = useRef(activeTargetId);
  const sensitivityRef = useRef(sensitivity);
  const conditionRef = useRef(condition);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [facingMode, setFacingMode] = useState("user");

  useEffect(() => { onFrameRef.current = onFrame; }, [onFrame]);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { targetsRef.current = targets; }, [targets]);
  useEffect(() => { activeTargetRef.current = activeTargetId; }, [activeTargetId]);
  useEffect(() => { sensitivityRef.current = sensitivity; }, [sensitivity]);
  useEffect(() => { conditionRef.current = condition; }, [condition]);

  useEffect(() => {
    if (!active) {
      setCameraReady(false);
      setModelReady(false);
      return undefined;
    }

    let cancelled = false;
    let stream;
    let handLandmarker;
    let poseLandmarker;
    let animationFrame;
    let lastAnalysisAt = 0;
    let lastHandAt = 0;
    let lastPoseAt = 0;
    let poseConfirmationFrames = 0;
    let latestPose = { personVisible: false, backFacing: false, polygon: null };
    let latestAnalysis = {
      backVisible: false,
      personVisible: false,
      backFacing: false,
      torsoPolygon: null,
      spots: [],
      skinRatio: 0,
    };
    let latestFinger = null;
    const videoElement = videoRef.current;

    async function initialize() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) return;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        setCameraReady(true);

        const vision = await FilesetResolver.forVisionTasks("/mediapipe");
        try {
          handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: "/models/hand_landmarker.task", delegate: "GPU" },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.45,
            minTrackingConfidence: 0.45,
          });
        } catch {
          handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: "/models/hand_landmarker.task", delegate: "CPU" },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.45,
            minTrackingConfidence: 0.45,
          });
        }
        try {
          poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: "/models/pose_landmarker_lite.task", delegate: "GPU" },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.6,
            minPosePresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });
        } catch {
          poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: "/models/pose_landmarker_lite.task", delegate: "CPU" },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.6,
            minPosePresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });
        }
        if (cancelled) return;
        setModelReady(true);
        onReadyRef.current?.();
        loop();
      } catch (error) {
        if (!cancelled) {
          const message = error?.name === "NotAllowedError"
            ? "Camera đang bị chặn. Hãy cấp quyền camera trong trình duyệt rồi thử lại."
            : `Không thể khởi tạo camera/MediaPipe: ${error?.message || "Lỗi không xác định"}`;
          onErrorRef.current?.(message);
        }
      }
    }

    function loop(now = performance.now()) {
      if (cancelled) return;
      const video = videoRef.current;
      const overlay = overlayRef.current;
      if (video?.readyState >= 2 && overlay) {
        const aspect = video.videoWidth / video.videoHeight || 16 / 9;
        overlay.width = 720;
        overlay.height = Math.round(720 / aspect);

        if (poseLandmarker && now - lastPoseAt > 140) {
          try {
            const poseResult = poseLandmarker.detectForVideo(video, now);
            const pose = getPoseTorso(poseResult.landmarks?.[0]);
            if (pose.backFacing) poseConfirmationFrames = Math.min(poseConfirmationFrames + 1, 6);
            else poseConfirmationFrames = Math.max(poseConfirmationFrames - 2, 0);
            latestPose = {
              ...pose,
              backFacing: pose.backFacing && poseConfirmationFrames >= 4,
              polygon: pose.backFacing ? pose.polygon : null,
            };
          } catch {
            poseConfirmationFrames = 0;
            latestPose = { personVisible: false, backFacing: false, polygon: null };
          }
          lastPoseAt = now;
        }

        if (now - lastAnalysisAt > 300) {
          const analysisCanvas = analysisCanvasRef.current;
          analysisCanvas.width = 360;
          analysisCanvas.height = Math.round(360 / aspect);
          const context = analysisCanvas.getContext("2d", { willReadFrequently: true });
          context.save();
          context.translate(analysisCanvas.width, 0);
          context.scale(-1, 1);
          context.drawImage(video, 0, 0, analysisCanvas.width, analysisCanvas.height);
          context.restore();
          const image = context.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);
          latestAnalysis = analyzeFrame(
            image,
            analysisCanvas.width,
            analysisCanvas.height,
            sensitivityRef.current,
            latestPose,
            conditionRef.current,
          );
          lastAnalysisAt = now;
        }

        if (handLandmarker && now - lastHandAt > 90) {
          try {
            const result = handLandmarker.detectForVideo(video, now);
            const tip = result.landmarks?.[0]?.[8];
            latestFinger = tip ? { x: 1 - tip.x, y: tip.y, z: tip.z } : null;
          } catch {
            latestFinger = null;
          }
          lastHandAt = now;
          onFrameRef.current?.({ ...latestAnalysis, finger: latestFinger });
        }

        drawOverlay(overlay, latestAnalysis, latestFinger, targetsRef.current, activeTargetRef.current);
      }
      animationFrame = requestAnimationFrame(loop);
    }

    initialize();
    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      handLandmarker?.close?.();
      poseLandmarker?.close?.();
      stream?.getTracks().forEach((track) => track.stop());
      if (videoElement) videoElement.srcObject = null;
    };
  }, [active, facingMode]);

  return (
    <Card className="overflow-hidden border-0 bg-[#142723] shadow-[0_24px_70px_rgba(18,48,42,0.18)]">
      <div className="relative aspect-video min-h-[280px] bg-[#142723]">
        <video ref={videoRef} muted playsInline className={`absolute inset-0 h-full w-full object-cover transition-opacity ${cameraReady ? "opacity-100" : "opacity-0"}`} style={{ transform: "scaleX(-1)" }} />
        <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,#274a43_0,#142723_70%)]">
            <div className="text-center text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10"><Camera size={30} /></div>
              <p className="font-semibold">Camera chưa bật</p>
              <p className="mt-1 text-xs text-white/55">Nhấn bắt đầu để cấp quyền</p>
            </div>
          </div>
        )}
        {active && !cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#142723] text-white">
            <div className="text-center"><RefreshCw className="mx-auto animate-spin" size={28} /><p className="mt-3 text-sm">Đang mở camera...</p></div>
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur ${cameraReady ? "bg-[#1d876f]/85 text-white" : "bg-black/35 text-white/60"}`}><CameraIcon className="mr-1 inline" size={12} /> Camera</span>
          <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur ${modelReady ? "bg-[#1d876f]/85 text-white" : "bg-black/35 text-white/60"}`}><Scan className="mr-1 inline" size={12} /> MediaPipe</span>
        </div>
        {active && cameraReady && (
          <button type="button" onClick={() => setFacingMode((mode) => mode === "user" ? "environment" : "user")} className="absolute right-4 top-4 rounded-full bg-black/40 p-2.5 text-white backdrop-blur hover:bg-black/55" aria-label="Đổi camera"><RefreshCw size={17} /></button>
        )}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-black/45 px-4 py-2 text-[11px] font-medium text-white backdrop-blur"><ShieldCheck size={14} className="text-[#79e0c1]" /> Xử lý cục bộ · không lưu video</div>
      </div>
    </Card>
  );
}

export default CameraView;
