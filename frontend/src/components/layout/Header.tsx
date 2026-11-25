/** Шапка сайта. Манифест: docs/manifests/ui/header.md (PERSONAL v2.0) */

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
  { href: "/diagnostics/", label: "Разбор процесса" },
  { href: "/contacts/", label: "Контакты" },
];

const CTA = "inline-flex items-center justify-center border border-transparent bg-[color:var(--c-ink)] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[color:var(--c-paper)] no-underline transition-colors hover:bg-[color:var(--c-lime)] hover:text-[color:var(--c-ink)]";

/** Липкая шапка: светлая бумага, графитовый текст, лайм-CTA при наведении. */
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
          ? "border-[color:var(--c-line)] bg-[color:var(--c-paper)]/95 backdrop-blur"
          : "border-transparent bg-[color:var(--c-paper)]")
      }
    >
      <div className="mx-auto flex h-16 w-full max-w-[var(--shell-max)] items-center justify-between gap-4 px-[var(--shell-gutter)] lg:h-[76px]">
        <Link
          href="/"
          aria-label="Дмитрий Аляев — на главную"
          className="font-[family-name:var(--font-display)] text-[15px] font-bold uppercase tracking-[0.14em] text-[color:var(--c-ink)] no-underline"
        >
          Дмитрий <span className="text-[color:var(--c-terracotta)]">Аляев</span>
        </Link>

        <nav aria-label="Основная навигация" className="hidden items-center gap-6 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={
                "text-[13px] uppercase tracking-[0.08em] no-underline transition-colors " +
                (isActive(item.href)
                  ? "text-[color:var(--c-ink)] underline decoration-[color:var(--c-lime)] decoration-2 underline-offset-8"
                  : "text-[color:var(--c-text-muted)] hover:text-[color:var(--c-ink)]")
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/contacts/#lead" className={CTA + " hidden sm:inline-flex"}>
            Обсудить проект
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center border border-[color:var(--c-line-2)] text-[color:var(--c-ink)] xl:hidden"
          >
            <span aria-hidden="true" className="text-lg">
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-menu" className="border-t border-[color:var(--c-line)] bg-[color:var(--c-paper)] xl:hidden">
          <nav aria-label="Мобильная навигация" className="mx-auto flex w-full max-w-[var(--shell-max)] flex-col px-[var(--shell-gutter)] py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="border-b border-[color:var(--c-line)] py-3 text-base text-[color:var(--c-ink)] no-underline last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/contacts/#lead" className={CTA + " mt-3"}>
              Обсудить проект
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
