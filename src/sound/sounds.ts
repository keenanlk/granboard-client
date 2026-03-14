import introSrc from "../assets/sounds/intro.mp3";
import hitSrc from "../assets/sounds/hit.mp3";
import bullSrc from "../assets/sounds/bull.mp3";
import dbullSrc from "../assets/sounds/dbull.mp3";
import tripleSrc from "../assets/sounds/triple.mp3";
import doubleSrc from "../assets/sounds/double.mp3";
import singleSrc from "../assets/sounds/single.mp3";
import buzzerSrc from "../assets/sounds/buzzer.mp3";

const intro = new Audio(introSrc);
const hit = new Audio(hitSrc);
const bull = new Audio(bullSrc);
const dbull = new Audio(dbullSrc);
const triple = new Audio(tripleSrc);
const double_ = new Audio(doubleSrc);
const single = new Audio(singleSrc);
const buzzer = new Audio(buzzerSrc);

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
