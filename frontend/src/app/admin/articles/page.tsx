/** Админка: статьи сайта. опубликованная статья сразу открывается по своему адресу.. Индексация закрыта, доступ проверяется на сервере. */

import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { ArticlesEditor } from "@/components/admin/ArticlesEditor";

export const metadata: Metadata = {
  title: "Блог",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
      <AdminNav current="/admin/articles/" />
      <h1 className="mb-1 text-2xl font-semibold">Блог</h1>
      <p className="mb-6 text-sm text-[color:var(--c-text-muted)]">Статьи сайта. Опубликованная статья сразу открывается по своему адресу.</p>
      <ArticlesEditor />
    </main>
  );
}
