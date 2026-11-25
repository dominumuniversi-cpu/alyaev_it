/** Админка: SEO-панель страниц. Индексация закрыта, доступ проверяется на сервере. */

import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { SeoEditor } from "@/components/admin/SeoEditor";

export const metadata: Metadata = {
  title: "SEO",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[var(--shell-max)] px-4 py-10 sm:px-6 lg:px-8">
      <AdminNav current="/admin/seo/" />
      <h1 className="mb-1 text-2xl font-semibold">SEO страниц</h1>
      <p className="mb-6 text-sm text-[color:var(--c-text-muted)]">
        Заголовок и описание для поисковиков. Проверки не дадут сохранить дубль Title.
      </p>
      <SeoEditor />
    </main>
  );
}
