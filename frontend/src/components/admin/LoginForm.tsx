/** Вход в админку. Манифест: docs/manifests/ui/field.md */

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

/** Форма входа: после успеха уводит в админку без перезагрузки страницы. */
export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  /** Отправляет данные входа и решает, куда идти дальше. */
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
        setError(res.status === 401 ? "Неверная почта или пароль" : "Не удалось войти. Попробуйте позже.");
        setSending(false);
        return;
      }
      window.location.assign(BASE_PATH + "/admin/");
    } catch {
      setError("Сеть недоступна. Проверьте соединение.");
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <TextField
        id="email"
        name="email"
        label="Почта"
        type="email"
        required
        autoComplete="username"
        disabled={sending}
      />
      <TextField
        id="password"
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