import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'lunora_theme';

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getSavedTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(THEME_STORAGE_KEY);
    if (val === 'dark' || val === 'light') return val;
  } catch (e) {}
  return null;
}

export function getActiveTheme(): Theme {
  const saved = getSavedTheme();
  if (saved) return saved;
  return getSystemTheme();
}

export function applyThemeToDom(theme: Theme) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
    html.classList.remove('light');
    html.setAttribute('data-theme', 'dark');
  } else {
    html.classList.remove('dark');
    html.classList.add('light');
    html.setAttribute('data-theme', 'light');
  }
}

export function saveThemePreference(theme: Theme) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {}
  applyThemeToDom(theme);
  // Dispatch custom window event so any listening components update immediately
  window.dispatchEvent(new CustomEvent('lunora-theme-change', { detail: theme }));
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getActiveTheme());

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(nextTheme);
    saveThemePreference(nextTheme);
  }, [theme]);

  useEffect(() => {
    // Synchronize initial DOM state
    applyThemeToDom(theme);

    // Listen for custom theme change events across windows/components
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>;
      if (customEvent.detail && (customEvent.detail === 'dark' || customEvent.detail === 'light')) {
        setThemeState(customEvent.detail);
      }
    };

    // Listen for storage changes from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        if (e.newValue === 'dark' || e.newValue === 'light') {
          setThemeState(e.newValue);
          applyThemeToDom(e.newValue);
        }
      }
    };

    // Listen for system theme changes if user hasn't chosen a manual preference
    let mqCleanup: (() => void) | undefined;
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handleMqChange = (e: MediaQueryListEvent) => {
        if (!getSavedTheme()) {
          const sysTheme: Theme = e.matches ? 'dark' : 'light';
          setThemeState(sysTheme);
          applyThemeToDom(sysTheme);
        }
      };

      if (mq.addEventListener) {
        mq.addEventListener('change', handleMqChange);
        mqCleanup = () => mq.removeEventListener('change', handleMqChange);
      } else if ((mq as any).addListener) {
        (mq as any).addListener(handleMqChange);
        mqCleanup = () => (mq as any).removeListener(handleMqChange);
      }
    }

    window.addEventListener('lunora-theme-change', handleCustomChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('lunora-theme-change', handleCustomChange);
      window.removeEventListener('storage', handleStorage);
      if (mqCleanup) mqCleanup();
    };
  }, [theme]);

  return { theme, toggleTheme };
}
