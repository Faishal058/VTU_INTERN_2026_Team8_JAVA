import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

/* Dark-mode native select fix */
const DARK_FIX = `
select { background: rgba(10,30,18,0.95); border: 1px solid rgba(255,255,255,0.12); color: #fff; color-scheme: dark; }
select option { background: #061a10; color: #fff; }
input[type="date"] { color-scheme: dark; }
`;

/* Light-mode: only what can't be done via CSS variables (no inline style overrides needed here — pages are refactored) */
const LIGHT_FIX = `
select { background: #fff; border: 1px solid rgba(0,0,0,0.15); color: #0d1f14; color-scheme: light; }
select option { background: #fff; color: #0d1f14; }
input[type="date"] { color-scheme: light; background: rgba(0,0,0,0.05); color: #0d1f14; }
input[type="range"] { accent-color: #4caf1e; }
`;

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('ww-theme') || 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('ww-theme', theme); } catch {}

    let tag = document.getElementById('ww-theme-inject');
    if (!tag) {
      tag = document.createElement('style');
      tag.id = 'ww-theme-inject';
      document.head.appendChild(tag);
    }
    tag.textContent = theme === 'light' ? LIGHT_FIX : DARK_FIX;
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
