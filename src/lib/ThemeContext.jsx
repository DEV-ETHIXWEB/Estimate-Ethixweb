import { createContext, useContext, useEffect, useState } from 'react';
import { getColors } from './theme.js';

const ThemeContext = createContext({ mode: 'dark', toggle: () => {}, colors: getColors('dark') });

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    try { localStorage.setItem('theme', mode); } catch { /* private mode etc - non-fatal */ }
    // Keep the browser chrome (iOS/Android status bar, task switcher card) in
    // sync with the theme actually showing, not just the OS default - index.html's
    // static <meta name="theme-color"> tags only cover the "never toggled" case.
    const bg = getColors(mode).bg;
    document.querySelectorAll('meta[name="theme-color"]').forEach(el => el.setAttribute('content', bg));
  }, [mode]);

  function toggle() { setMode(m => (m === 'dark' ? 'light' : 'dark')); }

  return (
    <ThemeContext.Provider value={{ mode, toggle, colors: getColors(mode) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
