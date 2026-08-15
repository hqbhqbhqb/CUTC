import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Link2, LoaderCircle, QrCode, RefreshCw, Smartphone, WifiOff } from "lucide-react";
import Peer from "peerjs";
import QRCode from "qrcode";

import Button from "../common/Button";

function makeSecret() {
  const bytes = new Uint8Array(24);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function PhoneCameraPairing({ active, onStream, onDisconnected }) {
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const connectionRef = useRef(null);
  const secretRef = useRef(makeSecret());
  const onStreamRef = useRef(onStream);
  const onDisconnectedRef = useRef(onDisconnected);
  const [generation, setGeneration] = useState(0);
  const [pairUrl, setPairUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [status, setStatus] = useState("creating");
  const [resolution, setResolution] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { onStreamRef.current = onStream; }, [onStream]);
  useEffect(() => { onDisconnectedRef.current = onDisconnected; }, [onDisconnected]);

  const disconnectCurrentPhone = useCallback(() => {
    callRef.current?.close?.();
    connectionRef.current?.close?.();
    callRef.current = null;
    connectionRef.current = null;
    setResolution("");
    onDisconnectedRef.current?.();
  }, []);

  useEffect(() => {
    if (!active) {
      disconnectCurrentPhone();
      peerRef.current?.destroy?.();
      peerRef.current = null;
      setPairUrl("");
      setQrDataUrl("");
      setStatus("creating");
      return undefined;
    }

    let cancelled = false;
    secretRef.current = makeSecret();
    setError("");
    setStatus("creating");
    setPairUrl("");
    setQrDataUrl("");

    const peer = new Peer(undefined, { debug: 1 });
    peerRef.current = peer;

    peer.on("open", async (peerId) => {
      if (cancelled) return;
      const hash = new URLSearchParams({ peer: peerId, token: secretRef.current }).toString();
      const url = `${window.location.origin}/phone-camera#${hash}`;
      setPairUrl(url);
      setStatus("waiting");
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#173f38", light: "#ffffff" },
        });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch {
        if (!cancelled) setError("The pairing QR code could not be generated. Copy the secure link instead.");
      }
    });

    peer.on("connection", (connection) => {
      const trusted = connection.metadata?.role === "dermacare-phone"
        && connection.metadata?.token === secretRef.current;
      if (!trusted) {
        connection.close();
        return;
      }
      connectionRef.current?.close?.();
      connectionRef.current = connection;
      connection.on("data", (message) => {
        if (message?.type === "camera-ready") {
          setResolution(message.resolution || "");
          setStatus("connecting");
        }
      });
      connection.on("close", () => {
        if (connectionRef.current === connection) {
          connectionRef.current = null;
          callRef.current = null;
          setStatus("waiting");
          setResolution("");
          onDisconnectedRef.current?.();
        }
      });
    });

    peer.on("call", (call) => {
      const trusted = call.metadata?.role === "dermacare-phone"
        && call.metadata?.token === secretRef.current;
      if (!trusted) {
        call.close();
        return;
      }
      callRef.current?.close?.();
      callRef.current = call;
      call.answer();
      setStatus("connecting");
      call.on("stream", (remoteStream) => {
        const track = remoteStream.getVideoTracks()[0];
        const settings = track?.getSettings?.() || {};
        const streamResolution = settings.width && settings.height ? `${settings.width}×${settings.height}` : "";
        if (streamResolution) setResolution(streamResolution);
        setStatus("connected");
        connectionRef.current?.send?.({ type: "desktop-connected" });
        onStreamRef.current?.(remoteStream);
      });
      call.on("close", () => {
        if (callRef.current === call) {
          callRef.current = null;
          setStatus("waiting");
          setResolution("");
          onDisconnectedRef.current?.();
        }
      });
      call.on("error", () => {
        setStatus("waiting");
        setError("The phone video connection ended. Scan the refreshed QR code and reconnect.");
      });
    });

    peer.on("error", (peerError) => {
      if (cancelled || peerError.type === "peer-unavailable") return;
      setError("Unable to reach the secure camera pairing service. Check both devices' internet connection and retry.");
      setStatus("error");
    });

    return () => {
      cancelled = true;
      disconnectCurrentPhone();
      peer.destroy();
      if (peerRef.current === peer) peerRef.current = null;
    };
  }, [active, disconnectCurrentPhone, generation]);

  const regenerate = () => {
    disconnectCurrentPhone();
    setGeneration((value) => value + 1);
  };

  const copyLink = async () => {
    if (!pairUrl) return;
    await navigator.clipboard.writeText(pairUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (!active) return null;

  return (
    <section className="rounded-3xl border border-[#dce9e6] bg-white p-5 shadow-sm" aria-label="Phone camera pairing">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex min-h-48 w-full shrink-0 items-center justify-center rounded-2xl bg-[#f3f8f6] p-3 sm:w-48">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Secure QR code for connecting the phone camera" className="h-44 w-44 rounded-xl" />
          ) : (
            <LoaderCircle className="animate-spin text-[#2d7a6d]" size={30} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[#2d7a6d]"><QrCode size={18} /><p className="text-xs font-bold uppercase tracking-[0.14em]">Secure phone camera</p></div>
          <h2 className="mt-2 text-xl font-bold text-[#193b35]">
            {status === "connected" ? "Rear camera connected" : "Scan this QR code with your phone"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#71827e]">
            Open the camera app on your phone, scan the code, then allow rear-camera access. Keep the phone fixed so every target remains aligned.
          </p>
          <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${status === "connected" ? "bg-[#e5f5ef] text-[#247568]" : status === "error" ? "bg-[#fff0ef] text-[#a94c45]" : "bg-[#eef2fa] text-[#6276a5]"}`}>
            {status === "connected" ? <Check size={14} /> : status === "error" ? <WifiOff size={14} /> : <Smartphone size={14} />}
            {status === "connected" ? `Connected${resolution ? ` · ${resolution}` : ""}` : status === "connecting" ? "Establishing encrypted video..." : status === "creating" ? "Creating private room..." : "Waiting for phone"}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={copyLink} disabled={!pairUrl} className="flex items-center gap-2 px-4 py-2 text-sm">
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy link"}
            </Button>
            <Button type="button" variant="outline" onClick={regenerate} className="flex items-center gap-2 px-4 py-2 text-sm"><RefreshCw size={16} /> New room</Button>
          </div>
        </div>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a94c45]">{error}</p>}
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#edf7f4] p-3 text-xs leading-5 text-[#45655f]">
        <Link2 size={16} className="mt-0.5 shrink-0" />
        The room uses a random one-time secret. WebRTC encrypts the live stream in transit; DermaCare does not upload or save frames.
      </div>
    </section>
  );
}

export default PhoneCameraPairing;
