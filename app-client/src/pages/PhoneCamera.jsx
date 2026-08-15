import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, LoaderCircle, LockKeyhole, RefreshCw, ScanLine, Smartphone, SunMedium, VideoOff } from "lucide-react";
import Peer from "peerjs";

import Button from "../components/common/Button";

function readPairingDetails() {
  const values = new URLSearchParams(window.location.hash.slice(1));
  const peer = values.get("peer") || "";
  const token = values.get("token") || "";
  return {
    peer: /^[A-Za-z0-9_-]{1,160}$/.test(peer) ? peer : "",
    token: /^[a-f0-9]{48}$/.test(token) ? token : "",
  };
}

function PhoneCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const connectionRef = useRef(null);
  const wakeLockRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [resolution, setResolution] = useState("");
  const [zoomRange, setZoomRange] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const pairing = readPairingDetails();

  const cleanUp = () => {
    callRef.current?.close?.();
    connectionRef.current?.close?.();
    peerRef.current?.destroy?.();
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    wakeLockRef.current?.release?.().catch(() => {});
    callRef.current = null;
    connectionRef.current = null;
    peerRef.current = null;
    streamRef.current = null;
    wakeLockRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => cleanUp, []);

  useEffect(() => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track || !zoomRange) return;
    track.applyConstraints({ advanced: [{ zoom }] }).catch(() => {});
  }, [zoom, zoomRange]);

  const connect = async () => {
    cleanUp();
    setError("");
    setStatus("permission");
    setResolution("");
    setTorchSupported(false);
    setTorchOn(false);
    if (!pairing.peer || !pairing.token) {
      setStatus("error");
      setError("This pairing link is invalid or incomplete. Generate a new QR code on the desktop.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: 3840, min: 1280 },
          height: { ideal: 2160, min: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      }).catch(() => navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      }));
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();

      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings?.() || {};
      const capabilities = track.getCapabilities?.() || {};
      const cameraResolution = settings.width && settings.height ? `${settings.width}×${settings.height}` : "Rear camera";
      setResolution(cameraResolution);
      if (capabilities.zoom && Number.isFinite(capabilities.zoom.min) && Number.isFinite(capabilities.zoom.max)) {
        const initialZoom = settings.zoom || capabilities.zoom.min || 1;
        setZoom(initialZoom);
        setZoomRange({ min: capabilities.zoom.min, max: capabilities.zoom.max, step: capabilities.zoom.step || 0.1 });
      } else {
        setZoomRange(null);
      }
      setTorchSupported(Boolean(capabilities.torch));
      if ("wakeLock" in navigator) wakeLockRef.current = await navigator.wakeLock.request("screen").catch(() => null);

      setStatus("connecting");
      const peer = new Peer(undefined, { debug: 1 });
      peerRef.current = peer;
      peer.on("open", () => {
        const metadata = { role: "dermacare-phone", token: pairing.token };
        const connection = peer.connect(pairing.peer, { reliable: true, metadata });
        connectionRef.current = connection;
        connection.on("open", () => {
          connection.send({ type: "camera-ready", resolution: cameraResolution });
          const call = peer.call(pairing.peer, stream, { metadata });
          callRef.current = call;
          call.on("close", () => setStatus("disconnected"));
          call.on("error", () => {
            setStatus("error");
            setError("The encrypted video connection failed. Return to the desktop and create a new room.");
          });
        });
        connection.on("data", (message) => {
          if (message?.type === "desktop-connected") setStatus("live");
        });
        connection.on("close", () => setStatus("disconnected"));
        connection.on("error", () => setStatus("disconnected"));
      });
      peer.on("error", () => {
        setStatus("error");
        setError("The pairing service could not connect. Check Wi-Fi or mobile data, then scan a new QR code.");
      });
    } catch (cameraError) {
      setStatus("error");
      setError(cameraError?.name === "NotAllowedError"
        ? "Rear-camera access was denied. Allow camera permission in the browser settings, then retry."
        : `Unable to start the rear camera: ${cameraError?.message || "Unknown error"}`);
    }
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      setError("This phone did not allow the browser to control the camera light.");
    }
  };

  const connected = status === "live";
  const busy = status === "permission" || status === "connecting";

  return (
    <main className="min-h-screen bg-[#10231f] px-4 py-6 text-white">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2d7a6d]"><Smartphone size={22} /></div>
            <div><p className="font-bold">DermaCare rear camera</p><p className="text-xs text-white/55">Phone publisher · no recording</p></div>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold"><LockKeyhole className="mr-1 inline" size={13} /> Encrypted</span>
        </div>

        <div className="relative mt-6 aspect-[3/4] overflow-hidden rounded-[28px] bg-[#1c3731] shadow-2xl">
          <video ref={videoRef} muted playsInline className={`absolute inset-0 h-full w-full object-cover ${status === "idle" || status === "error" ? "opacity-0" : "opacity-100"}`} />
          {(status === "idle" || status === "error") && (
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,#285348_0,#142723_70%)]">
              <div className="px-8 text-center"><Camera className="mx-auto text-[#7be0c2]" size={42} /><p className="mt-4 font-bold">Rear camera is ready to pair</p><p className="mt-2 text-sm leading-6 text-white/55">Place the phone on a stable stand with the full back, shoulders, and hips visible.</p></div>
            </div>
          )}
          {busy && <div className="absolute inset-0 flex items-center justify-center bg-black/25"><div className="rounded-2xl bg-black/50 px-5 py-4 text-center backdrop-blur"><LoaderCircle className="mx-auto animate-spin" size={26} /><p className="mt-2 text-sm">{status === "permission" ? "Starting rear camera..." : "Connecting to desktop..."}</p></div></div>}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {resolution && <span className="rounded-full bg-black/45 px-3 py-1.5 text-[11px] font-bold backdrop-blur">{resolution}</span>}
            {connected && <span className="rounded-full bg-[#1d876f]/90 px-3 py-1.5 text-[11px] font-bold backdrop-blur"><ScanLine className="mr-1 inline" size={12} /> Live on desktop</span>}
          </div>
          {zoomRange && (
            <label className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/50 px-4 py-3 text-xs font-bold backdrop-blur">
              <span className="flex justify-between"><span>Optical camera zoom</span><span>{zoom.toFixed(1)}×</span></span>
              <input type="range" min={zoomRange.min} max={zoomRange.max} step={zoomRange.step} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 w-full accent-[#65e6c2]" />
            </label>
          )}
        </div>

        <div className={`mt-5 flex items-start gap-3 rounded-2xl p-4 ${connected ? "bg-[#173f38]" : status === "error" || status === "disconnected" ? "bg-[#572f2c]" : "bg-white/10"}`}>
          {connected ? <CheckCircle2 className="mt-0.5 shrink-0 text-[#79e0c1]" size={21} /> : status === "error" || status === "disconnected" ? <VideoOff className="mt-0.5 shrink-0 text-[#ffaaa2]" size={21} /> : <ScanLine className="mt-0.5 shrink-0 text-[#79e0c1]" size={21} />}
          <div><p className="font-bold">{connected ? "Connected—leave this page open" : status === "disconnected" ? "Desktop disconnected" : status === "error" ? "Connection needs attention" : "Ready to connect"}</p><p className="mt-1 text-sm leading-6 text-white/65">{connected ? "The desktop now processes this live rear-camera stream. Do not move the phone after scanning begins." : error || "Tap the button below to grant camera access and join the one-time room."}</p></div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button onClick={connect} disabled={busy} className="flex items-center justify-center gap-2 bg-[#65cdb0] text-[#10231f] hover:bg-[#77ddbf]">{status === "idle" ? <Camera size={18} /> : <RefreshCw size={18} />} {status === "idle" ? "Connect rear camera" : "Reconnect"}</Button>
          {torchSupported && <Button onClick={toggleTorch} variant="outline" className="flex items-center justify-center gap-2 border-white/20 bg-white/10 text-white hover:bg-white/15"><SunMedium size={18} /> {torchOn ? "Turn camera light off" : "Turn camera light on"}</Button>}
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-white/45">Use soft, even lighting. The camera light can create glare and should only be used when the room is too dark.</p>
      </div>
    </main>
  );
}

export default PhoneCamera;
