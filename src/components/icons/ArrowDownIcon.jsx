// Passive scroll-cue icon - CSS-driven bounce (see .scroll-cue-icon in index.css),
// no JS animation needed since it plays continuously rather than on hover.
export default function ArrowDownIcon({ size = 24, color = 'currentColor', strokeWidth = 2, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <path d="M12 5l0 14" />
      <path d="M16 15l-4 4" />
      <path d="M8 15l4 4" />
    </svg>
  );
}
