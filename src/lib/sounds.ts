import hitSrc from "../assets/sounds/hit.mp3";
import bullSrc from "../assets/sounds/bull.mp3";

const hit = new Audio(hitSrc);
const bull = new Audio(bullSrc);

export const Sounds = {
  hit: () => { hit.currentTime = 0; void hit.play(); },
  bull: () => { bull.currentTime = 0; void bull.play(); },
};
