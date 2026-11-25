/** Переключатель темы. Манифест: docs/manifests/ui/theme.md.
 *
 * Тема хранится в cookie theme (dark | light). Сервер читает её в middleware и ставит класс
 * на html — поэтому страница отдаётся сразу в нужной теме, а не переключается скриптом после загрузки.
 * Переключение не перезагружает страницу: только класс на html и cookie.
 */

"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/** Текущая тема = класс на html (его поставил сервер). */
function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Запоминаем выбор на год: дальше сервер сразу отдаёт нужную тему. */
function saveTheme(theme: Theme) {
  document.cookie = "theme=" + theme + "; path=/; max-age=31536000; samesite=lax";
}

/** Кнопка «светлая / тёмная тема» для шапки. */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTheme(currentTheme());
    setReady(true);
  }, []);

  /** Переключает тему без перезагрузки и запоминает выбор. */
  function toggle() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    saveTheme(next);
    setTheme(next);
  }

  const isDark = theme === "dark";
  const label = isDark ? "Включить светлую тему" : "Включить тёмную тему";

  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} aria-pressed={isDark}
      className="inline-flex h-9 items-center gap-2 rounded-pill border border-[color:var(--c-line-2)] px-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[color:var(--c-ink)] transition-colors hover:border-[color:var(--c-ink)] hover:text-[color:var(--c-ink)]"
    >
      <span aria-hidden="true" className="text-[13px] leading-none">
        {ready && isDark ? "◐" : "◑"}
      </span>
      {compact ? null : <span className="hidden sm:inline">{isDark ? "Тёмная" : "Светлая"}</span>}
    </button>
  );
}
