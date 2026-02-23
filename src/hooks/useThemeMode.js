import { useEffect, useState } from "react";

export function useThemeMode(themeOptions) {
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof globalThis === "undefined") return "gray";
    const saved = globalThis.localStorage?.getItem("kanban-theme") || "gray";
    return themeOptions.some((option) => option.value === saved) ? saved : "gray";
  });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    if (typeof globalThis === "undefined") return;
    globalThis.localStorage?.setItem("kanban-theme", theme);
  }, [theme]);

  return {
    darkMode,
    setDarkMode,
    theme,
    setTheme,
  };
}
