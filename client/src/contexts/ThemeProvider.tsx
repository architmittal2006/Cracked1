import React, { useEffect, useState } from 'react';
import { ThemeContext, type ThemePreference } from './ThemeContext';

const STORAGE_KEY = 'cracked-theme';

function readSavedTheme(): ThemePreference {
  try {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'system';
  } catch {
    return 'system';
  }
}

function resolveTheme(theme: ThemePreference): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [theme, setTheme] = useState<ThemePreference>(readSavedTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const applyTheme = () => {
      const resolvedTheme = resolveTheme(theme);
      document.documentElement.dataset.theme = resolvedTheme;
      document.documentElement.dataset.themePreference = theme;
      const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (themeColor) themeColor.content = resolvedTheme === 'light' ? '#F7F8FA' : '#101114';
    };

    applyTheme();
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      console.error('Unable to save the selected theme preference.', error);
    }

    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
    return undefined;
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};
