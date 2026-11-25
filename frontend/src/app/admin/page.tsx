/** Админка: заявки. Индексация закрыта, доступ проверяется на сервере. */

import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { AttentionSummary } from "@/components/admin/AttentionSummary";
import { ChannelStatus } from "@/components/admin/ChannelStatus";
import { LeadsTable } from "@/components/admin/LeadsTable";

export const metadata: Metadata = {
  title: "Заявки",
  robots: { index: false, follow: false },
};

/** Страница с заявками. Данные грузятся на клиенте с cookie сессии. */
export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-[var(--shell-max)] px-4 py-10 sm:px-6 lg:px-8">
      <AdminNav current="/admin/" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Заявки</h1>
          <p className="mt-1 text-sm text-[color:var(--c-text-muted)]">Все обращения с сайта.</p>
      </div>
      <ChannelStatus />
      <AttentionSummary />
      <LeadsTable />
    </main>
  );
}