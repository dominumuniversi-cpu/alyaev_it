/** Вход в личный кабинет клиента (ТЗ 9.4). Индексация закрыта (ТЗ 11.5). */

import type { Metadata } from "next";

import { ClientLoginForm } from "@/components/account/ClientLoginForm";

export const metadata: Metadata = {
  title: "Вход в кабинет",
  robots: { index: false, follow: false },
};

/** Точка входа клиента. Отдельно от /login: там вход сотрудника в панель. */
export default function ClientLoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-16">
      <div className="w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-8">
        <h1 className="mb-1 text-xl font-semibold">Вход в личный кабинет</h1>
        <p className="mb-6 text-sm text-[color:var(--c-text-muted)]">
          Здесь ваши проекты, задачи и документы. Доступ выдаёт исполнитель после заказа.
        </p>
        <ClientLoginForm />
      </div>
    </main>
  );
}