/** Админка: управление услугами и ценами. */

import type { Metadata } from "next";

import { ServicesEditor } from "@/components/admin/ServicesEditor";

export const metadata: Metadata = {
  title: "Услуги и цены",
  robots: { index: false, follow: false },
};

/** Цены меняются здесь, без правки кода и пересборки. */
export default function AdminServicesPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <a href="/alyaev/admin/" className="text-sm text-[color:var(--c-text-muted)] no-underline hover:text-[color:var(--c-text)]">
          ← Заявки
        </a>
        <h1 className="mt-2 text-2xl font-semibold">Услуги и цены</h1>
        <p className="mt-1 text-sm text-[color:var(--c-text-muted)]">
          Изменения сразу видны на сайте. Пустая цена означает «по запросу».
        </p>
      </div>
      <ServicesEditor />
    </main>
  );
}
