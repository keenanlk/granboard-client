import introSrc from "../assets/sounds/intro.mp3";
import hitSrc from "../assets/sounds/hit.mp3";
import bullSrc from "../assets/sounds/bull.mp3";
import dbullSrc from "../assets/sounds/dbull.mp3";
import tripleSrc from "../assets/sounds/triple.mp3";
import doubleSrc from "../assets/sounds/double.mp3";
import singleSrc from "../assets/sounds/single.mp3";
import buzzerSrc from "../assets/sounds/buzzer.mp3";
import whooshSrc from "../assets/sounds/whoosh.mp3";

let _volume = parseFloat(localStorage.getItem("app-volume") ?? "1");

export function getVolume(): number {
  return _volume;
}

// Web Audio API context + gain node for iOS volume control
// (iOS ignores HTMLAudioElement.volume — only GainNode works)
let _ctx: AudioContext | null = null;
let _gain: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!_ctx) {
    _ctx = new AudioContext();
    _gain = _ctx.createGain();
    _gain.gain.value = _volume;
    _gain.connect(_ctx.destination);
  }
  return _ctx;
}

function getGain(): GainNode {
  getAudioContext();
  return _gain!;
}

interface Sound {
  play(): void;
}

function makeSound(src: string): Sound {
  // Pre-fetch the audio data
  let buffer: AudioBuffer | null = null;
  fetch(src)
    .then((res) => res.arrayBuffer())
    .then((arr) => getAudioContext().decodeAudioData(arr))
    .then((decoded) => {
      buffer = decoded;
    })
    .catch(() => {
      /* silent — sound just won't play */
    });

  return {
    play() {
      if (!buffer) return;
      const ctx = getAudioContext();
      if (ctx.state === "suspended") void ctx.resume();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(getGain());
      source.start(0);
    },
  };
}

export function setVolume(v: number) {
  _volume = v;
  if (_gain) _gain.gain.value = v;
  localStorage.setItem("app-volume", String(v));
}

/** Route an HTMLMediaElement (e.g. <video>) through the shared gain node. */
export function connectMediaElement(el: HTMLMediaElement): void {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  const source = ctx.createMediaElementSource(el);
  source.connect(getGain());
}

const intro = makeSound(introSrc);
const hit = makeSound(hitSrc);
const bull = makeSound(bullSrc);
const dbull = makeSound(dbullSrc);
const triple = makeSound(tripleSrc);
const double_ = makeSound(doubleSrc);
const single = makeSound(singleSrc);
const buzzer = makeSound(buzzerSrc);
const whoosh = makeSound(whooshSrc);

export const Sounds = {
  intro: () => intro.play(),
  hit: () => hit.play(),
  bull: () => bull.play(),
  dbull: () => dbull.play(),
  buzzer: () => buzzer.play(),
  triple: () => triple.play(),
  double: () => double_.play(),
  single: () => single.play(),
  whoosh: () => whoosh.play(),
};
