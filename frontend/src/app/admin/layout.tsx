/** Оболочка админки: без публичной шапки и подвала, закрыта от индексации. */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Панель управления", template: "%s — Панель" },
  robots: { index: false, follow: false },
};

/** Просто пропускает содержимое: шапка сайта здесь лишняя. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[color:var(--c-paper)]">{children}</div>;
}
