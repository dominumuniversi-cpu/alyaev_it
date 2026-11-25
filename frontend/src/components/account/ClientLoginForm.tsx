/** Вход клиента в кабинет. Манифест: docs/manifests/ui/field.md, docs/manifests/access-control.md */

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

/** Форма входа клиента: после успеха ведёт в кабинет, а не в админку. */
export function ClientLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  /** Отправляет почту и пароль, по успеху уводит в /account/. */
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSending(true);
    setError(null);
    try {
      const res = await fetch(BASE_PATH + "/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      });
      if (!res.ok) {
        // 429 — сработала защита от перебора (ТЗ 9.4); текст берём с сервера,
        // чтобы человек увидел, сколько ждать, а не общее «не удалось».
        if (res.status === 429) {
          const data = (await res.json().catch(() => ({}))) as { detail?: string };
          setError(data.detail ?? "Слишком много попыток. Попробуйте позже.");
        } else if (res.status === 401) {
          setError("Неверная почта или пароль");
        } else if (res.status === 403) {
          setError("Учётная запись заблокирована");
        } else {
          setError("Не удалось войти. Попробуйте позже.");
        }
        setSending(false);
        return;
      }
      window.location.assign(BASE_PATH + "/account/");
    } catch {
      setError("Сеть недоступна. Проверьте соединение.");
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <TextField
        id="client-email"
        name="email"
        label="Почта"
        type="email"
        required
        autoComplete="username"
        disabled={sending}
      />
      <TextField
        id="client-password"
        name="password"
        label="Пароль"
        type="password"
        required
        autoComplete="current-password"
        disabled={sending}
      />
      {error ? (
        <p role="alert" className="text-sm text-[color:var(--c-danger)]">{error}</p>
      ) : null}
      <Button type="submit" size="lg" disabled={sending}>
        {sending ? "Проверяем…" : "Войти"}
      </Button>
    </form>
  );
}