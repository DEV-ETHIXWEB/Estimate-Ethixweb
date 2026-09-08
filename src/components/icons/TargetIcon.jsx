// Hover-triggered animated icon. Motion pattern adapted from itshover.com's
// animated icon collection (motion/react useAnimate), ported to plain JSX.
import { useAnimate } from 'motion/react';

export default function TargetIcon({ size = 24, color = 'currentColor', strokeWidth = 2, className = '' }) {
  const [scope, animate] = useAnimate();

  function start() {
    animate('.circle-outer', { scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }, { duration: 0.6, ease: 'easeInOut' });
    animate('.circle-middle', { scale: [1, 1.15, 1], opacity: [1, 0.6, 1] }, { duration: 0.6, ease: 'easeInOut', delay: 0.1 });
    animate('.circle-inner', { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }, { duration: 0.6, ease: 'easeInOut', delay: 0.2 });
  }
  function stop() {
    animate('.circle-outer, .circle-middle, .circle-inner', { scale: 1, opacity: 1 }, { duration: 0.2, ease: 'easeInOut' });
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
      <circle className="circle-outer" cx="12" cy="12" r="10" style={{ transformOrigin: '12px 12px' }} />
      <circle className="circle-middle" cx="12" cy="12" r="6" style={{ transformOrigin: '12px 12px' }} />
      <circle className="circle-inner" cx="12" cy="12" r="2" style={{ transformOrigin: '12px 12px' }} />
    </svg>
  );
}
