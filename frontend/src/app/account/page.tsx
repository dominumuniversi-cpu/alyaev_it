/** Личный кабинет клиента: список проектов (ТЗ 9.1). Индексация закрыта (ТЗ 11.5). */

import type { Metadata } from "next";

import { AccountShell } from "@/components/account/AccountShell";

export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false, follow: false },
};

/** Кабинет целиком на клиенте: данные приходят по cookie сессии. */
export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-[var(--shell-max)] px-4 py-12">
      <AccountShell mode="list" />
    </main>
  );
}