/** Админка: отзывы клиентов. Индексация закрыта, доступ проверяется на сервере. */

import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { ReviewsEditor } from "@/components/admin/ReviewsEditor";

export const metadata: Metadata = {
  title: "Отзывы",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[var(--shell-max)] px-4 py-10 sm:px-6 lg:px-8">
      <AdminNav current="/admin/reviews/" />
      <h1 className="mb-1 text-2xl font-semibold">Отзывы</h1>
      <p className="mb-6 text-sm text-[color:var(--c-text-muted)]">
        Отзывы клиентов. Публикуются только с согласия автора.
      </p>
      <ReviewsEditor />
    </main>
  );
}
