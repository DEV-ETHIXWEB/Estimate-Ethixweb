import { useEffect, useState } from 'react';
import { useTheme } from '../lib/ThemeContext.jsx';
import ThemeIcon from './icons/ThemeIcon.jsx';
import MenuIcon from './icons/MenuIcon.jsx';
import ethixwebLogo from '../assets/ethixweb-wordmark.png';

const NAV_LINKS = [
  { id: 'calculator', label: 'Calculator' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'methodology', label: 'Methodology' },
];

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { mode, toggle } = useTheme();

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 24); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mobile-only menu: close it on Escape, and if a resize/rotation crosses
  // back into the desktop layout (where the inline nav is visible again) so
  // it can never get left open behind the scenes.
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e) { if (e.key === 'Escape') setMenuOpen(false); }
    const desktopQuery = window.matchMedia('(min-width: 701px)');
    function onDesktop(e) { if (e.matches) setMenuOpen(false); }
    document.addEventListener('keydown', onKey);
    desktopQuery.addEventListener('change', onDesktop);
    // Lock page scroll behind the open dropdown - it overlays content rather
    // than pushing it, so without this the page could scroll under it.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      desktopQuery.removeEventListener('change', onDesktop);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  function go(id) {
    scrollToId(id);
    setMenuOpen(false);
  }

  return (
    <header className={'navbar' + (scrolled ? ' navbar-scrolled' : '')}>
      <div className="navbar-inner">
        <button className="navbar-brand" onClick={() => go('hero')}>
          <img src={ethixwebLogo} alt="Ethixweb" className="navbar-logo" />
          <span className="navbar-brand-divider" aria-hidden="true" />
          <span className="navbar-brand-text">Forecast</span>
        </button>

        <nav className="navbar-links">
          {NAV_LINKS.map(l => <button key={l.id} onClick={() => go(l.id)}>{l.label}</button>)}
        </nav>
        <div className="navbar-actions">
          <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
            <ThemeIcon mode={mode} size={15} />
          </button>
          <button className="navbar-cta" onClick={() => go('calculator')}>Launch model</button>
        </div>

        <button
          className="navbar-menu-btn" onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="navbar-mobile-menu"
        >
          <MenuIcon open={menuOpen} />
        </button>
      </div>

      {menuOpen && (
        <>
          <button className="navbar-mobile-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <nav id="navbar-mobile-menu" className="navbar-mobile-menu">
            {NAV_LINKS.map(l => <button key={l.id} onClick={() => go(l.id)}>{l.label}</button>)}
            <div className="navbar-mobile-divider" />
            <button className="navbar-mobile-theme" onClick={toggle}>
              <ThemeIcon mode={mode} size={16} />
              {mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            </button>
            <button className="navbar-cta navbar-mobile-cta" onClick={() => go('calculator')}>Launch model</button>
          </nav>
        </>
      )}
    </header>
  );
}
