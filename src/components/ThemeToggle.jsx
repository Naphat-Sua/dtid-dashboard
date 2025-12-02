import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/useStore';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-lg transition-all duration-300 group
        ${isDark 
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' 
          : 'bg-blue-100 hover:bg-blue-200 text-blue-600'}`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <Sun 
          className={`absolute inset-0 transition-all duration-300 transform
            ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
        />
        {/* Moon icon */}
        <Moon 
          className={`absolute inset-0 transition-all duration-300 transform
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
        />
      </div>
      
      {/* Tooltip */}
      <span className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50
        ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-800 text-white'}`}>
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
