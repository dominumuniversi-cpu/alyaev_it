/** Карточка проекта клиента (ТЗ 9.1). Индексация закрыта (ТЗ 11.5). */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccountShell } from "@/components/account/AccountShell";

export const metadata: Metadata = {
  title: "Проект",
  robots: { index: false, follow: false },
};

/** В Next 15 params асинхронные: синхронное чтение устарело. */
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);
  // Нечисловой id — это не проект, а мусор в адресе: отдаём 404, не вопрошая базу.
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();

  return (
    <main className="mx-auto w-full max-w-[var(--shell-max)] px-4 py-12">
      <AccountShell mode="detail" projectId={projectId} />
    </main>
  );
}