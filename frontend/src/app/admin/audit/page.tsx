/** Админка: журнал действий. Индексация закрыта, доступ проверяется на сервере. */

import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { AuditLog } from "@/components/admin/AuditLog";

export const metadata: Metadata = {
  title: "Журнал действий",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
      <AdminNav current="/admin/audit/" />
      <h1 className="mb-1 text-2xl font-semibold">Журнал действий</h1>
      <p className="mb-6 text-sm text-[color:var(--c-text-muted)]">
        Кто и что изменил в админке: услуги, статьи, кейсы, отзывы, SEO и семантическое ядро.
        Записи создаются автоматически и не редактируются.
      </p>
      <AuditLog />
    </main>
  );
}
