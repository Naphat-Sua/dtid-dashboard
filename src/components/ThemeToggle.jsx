import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/useStore';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-2xl transition-all duration-500 group"
      style={{ 
        background: 'var(--glass-regular)',
        border: '1px solid var(--border-subtle)',
      }}
      onMouseOver={e => e.currentTarget.style.boxShadow = isDark ? 'var(--glow-blue)' : '0 4px 16px rgba(255, 149, 0, 0.25)'}
      onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <Sun 
          className={`absolute inset-0 transition-all duration-500 transform
            ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
          style={{ color: 'var(--accent-orange)' }}
        />
        {/* Moon icon */}
        <Moon 
          className={`absolute inset-0 transition-all duration-500 transform
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
          style={{ color: 'var(--accent-blue)' }}
        />
      </div>
      
      {/* Tooltip */}
      <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2.5 py-1 rounded-lg
        opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-50"
        style={{ background: 'var(--glass-chrome)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(20px)' }}>
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
