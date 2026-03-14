import { useEffect, useRef } from "react";
import type { AwardType } from "../lib/awards.ts";
import hattrickSrc from "../assets/awards/hattrick.mp4";
import ton80Src from "../assets/awards/ton80.mp4";
import hightonSrc from "../assets/awards/highton.mp4";
import lowtonSrc from "../assets/awards/lowton.mp4";
import threeinbedSrc from "../assets/awards/threeinbed.mp4";
import threeinblackSrc from "../assets/awards/threeinblack.mp4";
import whitehorseSrc from "../assets/awards/whitehorse.mp4";

export type { AwardType };

const AWARD_VIDEO: Record<AwardType, string> = {
  hattrick: hattrickSrc,
  ton80: ton80Src,
  highton: hightonSrc,
  lowton: lowtonSrc,
  threeinbed: threeinbedSrc,
  threeinblack: threeinblackSrc,
  whitehorse: whitehorseSrc,
};

const AWARD_LABEL: Record<AwardType, string> = {
  hattrick: "Hat Trick!",
  ton80: "Maximum!",
  highton: "High Ton!",
  lowton: "Low Ton!",
  threeinbed: "Three in a Bed!",
  threeinblack: "Three in Black!",
  whitehorse: "White Horse!",
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
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-10 flex flex-col items-center pointer-events-none">
        <p className="text-green-400 font-black text-3xl uppercase tracking-widest drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">
          {AWARD_LABEL[award]}
        </p>
        <p className="mt-2 text-zinc-400 text-sm uppercase tracking-wider">
          Tap to continue
        </p>
      </div>
    </div>
  );
}
