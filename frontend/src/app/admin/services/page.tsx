/** Админка: управление услугами и ценами. */

import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { ServicesEditor } from "@/components/admin/ServicesEditor";

export const metadata: Metadata = {
  title: "Услуги и цены",
  robots: { index: false, follow: false },
};

/** Цены меняются здесь, без правки кода и пересборки. */
export default function AdminServicesPage() {
  return (
    <main className="mx-auto w-full max-w-[var(--shell-max)] px-4 py-10 sm:px-6 lg:px-8">
      <AdminNav current="/admin/services/" />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Услуги и цены</h1>
        <p className="mt-1 text-sm text-[color:var(--c-muted)]">
          Изменения сразу видны на сайте. Пустая цена означает «по запросу».
        </p>
      </div>
      <ServicesEditor />
    </main>
  );
}
