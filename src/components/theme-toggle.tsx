'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('notebooklm-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('notebooklm-theme', 'light');
    }
  }

  if (!mounted) {
    return (
      <button
        className={`size-8 rounded-full flex items-center justify-center transition-colors duration-200 ${className ?? ''}`}
        aria-label="Toggle theme"
      >
        <Sun className="size-4 text-[var(--text-secondary)]" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`size-8 rounded-full flex items-center justify-center hover:bg-[var(--surface-container)] transition-colors duration-200 cursor-pointer ${className ?? ''}`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="size-4 text-[var(--text-secondary)]" />
      ) : (
        <Moon className="size-4 text-[var(--text-secondary)]" />
      )}
    </button>
  );
}
