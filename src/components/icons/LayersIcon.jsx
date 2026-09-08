// Hover-triggered animated icon. Motion pattern adapted from itshover.com's
// animated icon collection (motion/react useAnimate), ported to plain JSX.
import { useAnimate } from 'motion/react';

export default function LayersIcon({ size = 24, color = 'currentColor', className = '' }) {
  const [scope, animate] = useAnimate();

  function start() {
    animate('.top-block', { x: -3 }, { duration: 0.35, ease: [0.4, 0, 0.2, 1] });
  }
  function stop() {
    animate('.top-block', { x: 0 }, { duration: 0.35, ease: [0.4, 0, 0.2, 1] });
  }

  return (
    <svg
      ref={scope}
      onPointerEnter={start}
      onPointerLeave={stop}
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: 'visible' }}
    >
      <rect className="top-block" x="9" y="4" width="11" height="7" rx="2" fill={color} />
      <rect x="4" y="12" width="13" height="8" rx="2.4" fill={color} opacity="0.55" />
    </svg>
  );
}
