/** Админка: кейсы и демонстрационные проекты. статус проекта показывается посетителю честно.. Индексация закрыта, доступ проверяется на сервере. */

import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { PortfolioEditor } from "@/components/admin/PortfolioEditor";

export const metadata: Metadata = {
  title: "Портфолио",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
      <AdminNav current="/admin/portfolio/" />
      <h1 className="mb-1 text-2xl font-semibold">Портфолио</h1>
      <p className="mb-6 text-sm text-[color:var(--c-text-muted)]">Кейсы и демонстрационные проекты. Статус проекта показывается посетителю честно.</p>
      <PortfolioEditor />
    </main>
  );
}
