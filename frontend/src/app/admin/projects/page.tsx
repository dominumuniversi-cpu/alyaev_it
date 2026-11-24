/** Админка: проекты клиентов. Индексация закрыта, права проверяются на сервере. */

import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { ProjectsAdmin } from "@/components/admin/ProjectsAdmin";

export const metadata: Metadata = {
  title: "Проекты",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
      <AdminNav current="/admin/projects/" />
      <h1 className="mb-1 text-2xl font-semibold">Проекты клиентов</h1>
      <p className="mb-6 text-sm text-[color:var(--c-text-muted)]">
        Статус меняется сразу при выборе и попадает в историю проекта — клиент видит
        его в своём кабинете. Там же он видит задачи, которые вы добавите.
      </p>
      <ProjectsAdmin />
    </main>
  );
}
