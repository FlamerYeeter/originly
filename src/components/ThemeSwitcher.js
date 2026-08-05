"use client";

import { useTheme } from "@/context/ThemeContext";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="btn-app"
      aria-label={`Switch to ${nextTheme} theme`}
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
