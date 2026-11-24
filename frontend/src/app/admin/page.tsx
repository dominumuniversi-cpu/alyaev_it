/** Админка: заявки. Индексация закрыта, доступ проверяется на сервере. */

import type { Metadata } from "next";

import { LeadsTable } from "@/components/admin/LeadsTable";

export const metadata: Metadata = {
  title: "Заявки",
  robots: { index: false, follow: false },
};

/** Страница с заявками. Данные грузятся на клиенте с cookie сессии. */
export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <a href="/alyaev/admin/services/" className="text-sm text-[color:var(--c-text-muted)] no-underline hover:text-[color:var(--c-text)]">
            Услуги и цены →
          </a>
          <h1 className="mt-2 text-2xl font-semibold">Заявки</h1>
          <p className="mt-1 text-sm text-[color:var(--c-text-muted)]">Все обращения с сайта.</p>
        </div>
      </div>
      <LeadsTable />
    </main>
  );
}