// Hover-triggered animated icon. Motion pattern adapted from itshover.com's
// animated icon collection (motion/react useAnimate), ported to plain JSX.
import { useAnimate } from 'motion/react';

export default function GaugeIcon({ size = 24, color = 'currentColor', strokeWidth = 2, className = '' }) {
  const [scope, animate] = useAnimate();

  function start() {
    animate('.needle', { rotate: [0, 45, -20, 30, 0] }, { duration: 0.8, ease: 'easeInOut' });
  }
  function stop() {
    animate('.needle', { rotate: 0 }, { duration: 0.3, ease: 'easeInOut' });
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
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
      <path className="needle" style={{ transformOrigin: '12px 14px' }} d="m12 14 4-4" />
    </svg>
  );
}
