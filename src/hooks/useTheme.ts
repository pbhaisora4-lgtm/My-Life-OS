import { useState, useEffect } from 'react';

export function useTheme(initialTheme: 'dark' | 'light' | 'system' = 'dark') {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(() => {
    const saved = localStorage.getItem('lifeos_theme');
    return (saved as 'dark' | 'light' | 'system') || initialTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches);
      if (isDark) {
        root.classList.add('dark');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#07090e');
      } else {
        root.classList.remove('dark');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f8fafc');
      }
    };

    applyTheme();
    localStorage.setItem('lifeos_theme', theme);

    const listener = () => {
      if (theme === 'system') applyTheme();
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  return { theme, setTheme };
}
