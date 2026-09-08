// Hover-triggered animated icon. Motion pattern adapted from itshover.com's
// animated icon collection (motion/react useAnimate), ported to plain JSX.
import { useAnimate } from 'motion/react';

export default function SlidersIcon({ size = 24, color = 'currentColor', strokeWidth = 2, className = '' }) {
  const [scope, animate] = useAnimate();

  function start() {
    animate('.slider-1', { x: [0, -4, 0] }, { duration: 1.4, ease: 'easeInOut' });
    animate('.slider-2', { x: [0, 4, 0] }, { duration: 1.4, ease: 'easeInOut', delay: 0.12 });
    animate('.slider-3', { x: [0, -4, 0] }, { duration: 1.4, ease: 'easeInOut', delay: 0.24 });
  }
  function stop() {
    animate('.slider-1, .slider-2, .slider-3', { x: 0 }, { duration: 0.25 });
  }

  return (
    <svg
      ref={scope}
      onPointerEnter={start}
      onPointerLeave={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <line x1="3" y1="5" x2="21" y2="5" />
      <line className="slider-1" x1="14" y1="3" x2="14" y2="7" stroke={color} strokeWidth={strokeWidth + 2} />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line className="slider-2" x1="8" y1="10" x2="8" y2="14" stroke={color} strokeWidth={strokeWidth + 2} />
      <line x1="3" y1="19" x2="21" y2="19" />
      <line className="slider-3" x1="16" y1="17" x2="16" y2="21" stroke={color} strokeWidth={strokeWidth + 2} />
    </svg>
  );
}
