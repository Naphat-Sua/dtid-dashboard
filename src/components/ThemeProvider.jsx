import React, { useEffect } from 'react';
import { useThemeStore } from '../store/useStore';

export const ThemeProvider = ({ children }) => {
  const { theme } = useThemeStore();

  useEffect(() => {
    // Update document class for Tailwind dark mode
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  return <>{children}</>;
};

export default ThemeProvider;
