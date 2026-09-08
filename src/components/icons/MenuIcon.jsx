// Simple three-bar hamburger that morphs into an X - plain CSS transforms via
// the `open` prop, no animation library needed for something this small.
export default function MenuIcon({ open, size = 18 }) {
  return (
    <span className="menu-icon" style={{ width: size, height: size * 0.72 }}>
      <span className={'menu-icon-bar' + (open ? ' open' : '')} />
      <span className={'menu-icon-bar' + (open ? ' open' : '')} />
      <span className={'menu-icon-bar' + (open ? ' open' : '')} />
    </span>
  );
}
