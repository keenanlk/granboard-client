import hitSrc from "../assets/sounds/hit.mp3";
import bullSrc from "../assets/sounds/bull.mp3";
import triple0Src from "../assets/sounds/triple.mp3";
import triple1Src from "../assets/sounds/triple-1.mp3";
import buzzerSrc from "../assets/sounds/buzzer.mp3";

const hit = new Audio(hitSrc);
const bull = new Audio(bullSrc);
const buzzer = new Audio(buzzerSrc);
const triples = [new Audio(triple0Src), new Audio(triple1Src)];

export const Sounds = {
  hit: () => { hit.currentTime = 0; void hit.play(); },
  bull: () => { bull.currentTime = 0; void bull.play(); },
  buzzer: () => { buzzer.currentTime = 0; void buzzer.play(); },
  triple: () => {
    const audio = triples[Math.floor(Math.random() * triples.length)];
    audio.currentTime = 0;
    void audio.play();
  },
};
