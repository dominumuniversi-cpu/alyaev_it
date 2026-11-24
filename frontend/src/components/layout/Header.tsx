/** Шапка сайта. Манифест: docs/manifests/ui/header.md */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/services/", label: "Услуги" },
  { href: "/portfolio/", label: "Портфолио" },
  { href: "/about/", label: "Обо мне" },
  { href: "/blog/", label: "Блог" },
  { href: "/calculator/", label: "Калькулятор" },
  { href: "/contacts/", label: "Контакты" },
];

/** Липкая шапка с навигацией и мобильным меню. */
export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header
      className={
        "sticky top-0 z-50 border-b transition-colors duration-150 " +
        (scrolled
          ? "border-[color:var(--c-border)] bg-[color:var(--c-bg)]/95 backdrop-blur"
          : "border-transparent bg-transparent")
      }
    >
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <Link
          href="/"
          aria-label="Дмитрий Аляев — на главную"
          className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight no-underline"
        >
          Дмитрий <span className="text-[color:var(--c-gold)]">Аляев</span>
        </Link>

        <nav aria-label="Основная навигация" className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={
                "text-sm no-underline transition-colors hover:text-[color:var(--c-gold)] " +
                (isActive(item.href) ? "text-[color:var(--c-gold)]" : "text-[color:var(--c-text)]")
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/contacts/#lead"
            className="hidden rounded-xl bg-[color:var(--c-gold)] px-5 py-2.5 text-sm font-semibold text-[#0A0C12] no-underline transition-colors hover:bg-[#EFCF98] sm:inline-flex"
          >
            Обсудить проект
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--c-border)] text-[color:var(--c-text)] lg:hidden"
          >
            <span aria-hidden="true" className="text-lg">
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-menu" className="border-t border-[color:var(--c-border)] bg-[color:var(--c-bg)] lg:hidden">
          <nav aria-label="Мобильная навигация" className="mx-auto flex w-full max-w-[1200px] flex-col px-4 py-3 sm:px-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="border-b border-[color:var(--c-border)] py-3 text-base no-underline last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contacts/#lead"
              className="mt-3 rounded-xl bg-[color:var(--c-gold)] px-5 py-3 text-center text-sm font-semibold text-[#0A0C12] no-underline"
            >
              Обсудить проект
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}