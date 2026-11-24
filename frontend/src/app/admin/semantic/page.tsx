/** Админка: семантическое ядро. Индексация закрыта, доступ проверяется на сервере. */

import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { SemanticEditor } from "@/components/admin/SemanticEditor";

export const metadata: Metadata = {
  title: "Семантическое ядро",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
      <AdminNav current="/admin/semantic/" />
      <h1 className="mb-1 text-2xl font-semibold">Семантическое ядро</h1>
      <p className="mb-6 text-sm text-[color:var(--c-text-muted)]">
        Поисковые запросы, целевые страницы и позиции. Одна страница закрывает группу запросов.
      </p>
      <SemanticEditor />
    </main>
  );
}
