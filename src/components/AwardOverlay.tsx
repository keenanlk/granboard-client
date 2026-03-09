import { useEffect, useRef } from "react";
import type { AwardType } from "../lib/awards.ts";
import lowtonSrc from "../assets/awards/lowton.mp4";
import hattrickSrc from "../assets/awards/hattrick.mp4";

export type { AwardType };

const AWARD_VIDEO: Record<AwardType, string> = {
  hattrick: hattrickSrc,
  lowton: lowtonSrc,
};

const AWARD_LABEL: Record<AwardType, string> = {
  hattrick: "Hat Trick!",
  lowton: "Low Ton!",
};

interface AwardOverlayProps {
  award: AwardType;
  onDismiss: () => void;
}

export function AwardOverlay({ award, onDismiss }: AwardOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play();
  }, [award]);

  return (
    <div
      className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center cursor-pointer"
      onClick={onDismiss}
    >
      <video
        ref={videoRef}
        src={AWARD_VIDEO[award]}
        onEnded={onDismiss}
        playsInline
        muted={false}
        className="max-h-[70vh] max-w-full rounded-xl shadow-[0_0_60px_rgba(34,197,94,0.3)]"
      />
      <p className="mt-4 text-green-400 font-black text-3xl uppercase tracking-widest drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">
        {AWARD_LABEL[award]}
      </p>
      <p className="mt-2 text-zinc-500 text-sm uppercase tracking-wider">
        Tap to continue
      </p>
    </div>
  );
}
