// Hover-triggered animated icon. Motion pattern adapted from itshover.com's
// animated icon collection (motion/react useAnimate), ported to plain JSX.
import { useAnimate } from 'motion/react';

export default function DoubleCheckIcon({ size = 24, color = 'currentColor', strokeWidth = 2, className = '' }) {
  const [scope, animate] = useAnimate();

  async function start() {
    await animate('.check-first', { pathLength: [0, 1], opacity: [0, 1] }, { duration: 0.4, ease: 'easeInOut' });
    await animate('.check-second', { pathLength: [0, 1], opacity: [0, 1] }, { duration: 0.4, ease: 'easeInOut' });
  }
  function stop() {
    animate('.check-first, .check-second', { pathLength: 1, opacity: 1 }, { duration: 0.2, ease: 'easeInOut' });
  }

  return (
    <svg
      ref={scope}
      onPointerEnter={start}
      onPointerLeave={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size} viewBox="0 0 48 48" fill="none"
      stroke={color} strokeWidth={strokeWidth * 2} strokeMiterlimit="10" strokeLinecap="square"
      className={className}
    >
      <path className="check-first" style={{ transformOrigin: '19px 25px' }} d="M3 26.4L11.8846 39L35 11" />
      <path className="check-second" style={{ transformOrigin: '33px 25px' }} d="M45 11L21.8847 39L20.2098 36.6248" />
    </svg>
  );
}
