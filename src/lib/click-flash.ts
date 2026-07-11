import type { MouseEvent } from 'react';

// Brief blue flash on click as visual confirmation — pair with the `.click-flash`
// keyframe in globals.css. Works on any element via onClick={flashClick}.
export function flashClick(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  el.classList.remove('click-flash');
  void el.offsetWidth; // restart the animation if clicked again before it finishes
  el.classList.add('click-flash');
}
