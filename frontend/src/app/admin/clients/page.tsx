/** Админка: клиенты и доступ в кабинет. Индексация закрыта, права проверяются на сервере. */

import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { ClientsAdmin } from "@/components/admin/ClientsAdmin";

export const metadata: Metadata = {
  title: "Клиенты",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
      <AdminNav current="/admin/clients/" />
      <h1 className="mb-1 text-2xl font-semibold">Клиенты и доступ</h1>
      <p className="mb-6 text-sm text-[color:var(--c-text-muted)]">
        Клиент не регистрируется сам: карточку и вход заводите вы. Пароль показывается один раз —
        передайте его клиенту сразу. Перевыпуск пароля завершает все его открытые сессии.
      </p>
      <ClientsAdmin />
    </main>
  );
}
