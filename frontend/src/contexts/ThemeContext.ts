import { createContext } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
