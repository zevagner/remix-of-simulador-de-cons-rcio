import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', setTheme: () => {} });

export function ThemeProvider({ children, defaultTheme = 'light', storageKey = 'theme' }: { children: ReactNode; defaultTheme?: Theme; storageKey?: string; attribute?: string }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try { return (localStorage.getItem(storageKey) as Theme) || defaultTheme; } catch { return defaultTheme; }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    root.classList.add(resolved);
    try { localStorage.setItem(storageKey, theme); } catch {}
  }, [theme, storageKey]);

  const setTheme = (t: Theme) => setThemeState(t);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
