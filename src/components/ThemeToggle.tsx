import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('dav_theme') as Theme) || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    root.classList.remove('dark');

    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('dav_theme', 'dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      localStorage.setItem('dav_theme', 'light');
    } else {
      localStorage.setItem('dav_theme', 'system');
      if (systemPrefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const root = document.documentElement;
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 transition-all shadow-sm cursor-pointer"
      title={`Theme: ${theme}`}
    >
      {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
      {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
      {theme === 'system' && <Monitor className="w-3.5 h-3.5 text-slate-400" />}
      <span className="capitalize">{theme}</span>
    </button>
  );
}
