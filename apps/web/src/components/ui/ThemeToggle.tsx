"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-surface-variant/50 animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center justify-center w-10 h-10 rounded-full text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors focus:outline-none"
      aria-label="Toggle theme"
    >
      <Sun 
        size={20} 
        className={`absolute transition-all duration-300 ${isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"}`}
      />
      <Moon 
        size={20} 
        className={`absolute transition-all duration-300 ${isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`}
      />
    </button>
  );
}
