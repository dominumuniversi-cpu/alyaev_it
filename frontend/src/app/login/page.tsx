/** Страница входа в админку. Индексация закрыта. */

import type { Metadata } from "next";

import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Вход",
  robots: { index: false, follow: false },
};

/** Единственная точка входа в панель управления. */
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-16">
      <div className="w-full rounded-2xl border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-8">
        <h1 className="mb-1 text-xl font-semibold">Вход в панель</h1>
        <p className="mb-6 text-sm text-[color:var(--c-muted)]">Доступ только для сотрудников.</p>
        <LoginForm />
      </div>
    </main>
  );
}
