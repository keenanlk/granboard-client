import introSrc from "../assets/sounds/intro.mp3";
import hitSrc from "../assets/sounds/hit.mp3";
import bullSrc from "../assets/sounds/bull.mp3";
import dbullSrc from "../assets/sounds/dbull.mp3";
import tripleSrc from "../assets/sounds/triple.mp3";
import doubleSrc from "../assets/sounds/double.mp3";
import singleSrc from "../assets/sounds/single.mp3";
import buzzerSrc from "../assets/sounds/buzzer.mp3";

let _volume = parseFloat(localStorage.getItem("app-volume") ?? "1");

export function getVolume(): number { return _volume; }

const allAudio: HTMLAudioElement[] = [];

function makeAudio(src: string): HTMLAudioElement {
  const a = new Audio(src);
  a.volume = _volume;
  allAudio.push(a);
  return a;
}

export function setVolume(v: number) {
  _volume = v;
  for (const a of allAudio) a.volume = v;
  localStorage.setItem("app-volume", String(v));
}

const intro = makeAudio(introSrc);
const hit = makeAudio(hitSrc);
const bull = makeAudio(bullSrc);
const dbull = makeAudio(dbullSrc);
const triple = makeAudio(tripleSrc);
const double_ = makeAudio(doubleSrc);
const single = makeAudio(singleSrc);
const buzzer = makeAudio(buzzerSrc);

export const Sounds = {
  intro: () => { intro.currentTime = 0; void intro.play(); },
  hit: () => { hit.currentTime = 0; void hit.play(); },
  bull: () => { bull.currentTime = 0; void bull.play(); },
  dbull: () => { dbull.currentTime = 0; void dbull.play(); },
  buzzer: () => { buzzer.currentTime = 0; void buzzer.play(); },
  triple: () => { triple.currentTime = 0; void triple.play(); },
  double: () => { double_.currentTime = 0; void double_.play(); },
  single: () => { single.currentTime = 0; void single.play(); },
};
