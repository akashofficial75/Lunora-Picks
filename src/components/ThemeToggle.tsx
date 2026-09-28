import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../lib/theme';

interface ThemeToggleProps {
  className?: string;
  variant?: 'header' | 'admin' | 'mobile';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between py-3 px-3.5 min-h-[48px] rounded-xl drawer-theme-toggle text-sm font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${className}`}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span className="flex items-center gap-2.5">
          {isDark ? (
            <Sun className="w-5 h-5 text-[var(--theme-icon-accent)]" />
          ) : (
            <Moon className="w-5 h-5 text-[var(--theme-icon)]" strokeWidth={2.25} />
          )}
          <span className="text-[var(--theme-text-primary)] font-medium">Appearance: {isDark ? 'Dark Luxury' : 'Ivory Light'}</span>
        </span>
        <span className="text-[11px] px-2.5 py-1 rounded-md drawer-theme-chip uppercase tracking-widest font-mono font-medium">
          {isDark ? 'Light' : 'Dark'}
        </span>
      </button>
    );
  }

  if (variant === 'admin') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`px-3 py-2 min-h-[38px] rounded-lg text-xs font-medium border border-[#e6ca85]/20 hover:border-[#e6ca85]/40 text-[#1A1917] dark:text-[#edebe6] bg-[#e6ca85]/5 hover:bg-[#e6ca85]/15 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 flex items-center gap-2 shadow-sm ${className}`}
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-[#e6ca85]" />
            <span className="hidden sm:inline text-[#d4d1c9]">Light</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-[#A07C2E]" />
            <span className="hidden sm:inline text-[#1A1917]">Dark</span>
          </>
        )}
      </button>
    );
  }

  // Default header icon button
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`header-action-btn flex-shrink-0 max-[359px]:hidden group ${className}`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-[#edebe6] dark:text-[#edebe6] transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110" strokeWidth={2} />
      ) : (
        <Moon className="w-5 h-5 text-[#1A1917] dark:text-[#edebe6] transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" strokeWidth={2.25} />
      )}
    </button>
  );
};
