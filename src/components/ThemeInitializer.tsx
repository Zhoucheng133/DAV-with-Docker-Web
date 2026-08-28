import { useEffect } from 'react';

export function ThemeInitializer() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('dav_theme') || 'system';
    const root = document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    root.classList.remove('dark', 'light');

    if (savedTheme === 'dark') {
      root.classList.add('dark');
    } else if (savedTheme === 'light') {
      root.classList.remove('dark');
    } else {
      if (systemPrefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, []);

  return null;
}
