/** Клиенты в админке: список, создание, выдача доступа (ТЗ 9.2).
 *
 * Манифест: docs/manifests/ui/admin-clients.md.
 * Правило проекта: действия через fetch, без перезагрузки страницы.
 */

"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

type Client = {
  id: number;
  display_name: string;
  company: string;
  has_login: boolean;
  projects_count: number;
  created_at: string | null;
};

type Credentials = { email: string; password: string; warning: string };

/** Дата в коротком виде; пустое значение не ломает вёрстку. */
function shortDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("ru-RU");
}

/** Экран клиентов: таблица, форма создания и выдача доступа. */
export function ClientsAdmin() {
  const [clients, setClients] = useState<Client[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  /** Загружает клиентов; при отказе в правах уводит на вход. */
  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/clients", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401 || res.status === 403) {
        window.location.assign(BASE_PATH + "/login/");
        return;
      }
      if (!res.ok) { setState("error"); return; }
      const data = await res.json();
      setClients(data.items ?? []);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  /** Создаёт клиента и обновляет список без перезагрузки страницы. */
  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setNotice(null);
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          display_name: String(formData.get("display_name") ?? ""),
          company: String(formData.get("company") ?? ""),
        }),
      });
      if (!res.ok) { setNotice("Не удалось создать клиента."); return; }
      form.reset();
      setNotice("Клиент создан.");
      await load();
    } catch {
      setNotice("Сеть недоступна.");
    }
  }

  /** Выдаёт доступ: почта запрашивается здесь же, пароль показывается один раз. */
  async function onGrant(client: Client) {
    const email = window.prompt("Почта для входа клиента:", "");
    if (!email) return;
    setBusy(client.id);
    setNotice(null);
    try {
      const res = await fetch(
        BASE_PATH + "/api/v1/admin/clients/" + client.id + "/access?email=" + encodeURIComponent(email),
        { method: "POST", credentials: "include" },
      );
      const data = (await res.json().catch(() => ({}))) as { detail?: string; password?: string; email?: string; warning?: string };
      if (!res.ok) {
        setNotice(data.detail ?? "Не удалось выдать доступ.");
        return;
      }
      setCreds({ email: data.email ?? email, password: data.password ?? "", warning: data.warning ?? "" });
      await load();
    } catch {
      setNotice("Сеть недоступна.");
    } finally {
      setBusy(null);
    }
  }

  /** Перевыпуск пароля: старые сессии клиента гасятся на сервере. */
  async function onReset(client: Client) {
    setBusy(client.id);
    setNotice(null);
    try {
      const res = await fetch(
        BASE_PATH + "/api/v1/admin/clients/" + client.id + "/reset-password",
        { method: "POST", credentials: "include" },
      );
      const data = (await res.json().catch(() => ({}))) as { detail?: string; password?: string; email?: string; warning?: string };
      if (!res.ok) {
        setNotice(data.detail ?? "Не удалось перевыпустить пароль.");
        return;
      }
      setCreds({ email: data.email ?? "", password: data.password ?? "", warning: data.warning ?? "" });
    } catch {
      setNotice("Сеть недоступна.");
    } finally {
      setBusy(null);
    }
  }

  if (state === "loading") return <p className="text-[color:var(--c-text-muted)]">Загружаем…</p>;
  if (state === "error") return <p role="alert" className="text-[color:var(--c-danger)]">Не удалось загрузить клиентов.</p>;

  return (
    <div className="space-y-8">
      {creds ? <CredentialsCard creds={creds} onClose={() => setCreds(null)} /> : null}

      {notice ? (
        <p role="status" className="rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] px-4 py-3 text-sm">
          {notice}
        </p>
      ) : null}

      <form onSubmit={onCreate} className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
        <h2 className="mb-4 text-lg font-semibold">Новый клиент</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="display_name" name="display_name" label="Имя или название" required />
          <TextField id="company" name="company" label="Компания (необязательно)" />
        </div>
        <div className="mt-4">
          <Button type="submit">Создать клиента</Button>
        </div>
      </form>

      {clients.length === 0 ? (
        <p className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-8 text-center text-[color:var(--c-text-muted)]">
          Клиентов пока нет. Создайте первого — затем выдайте ему доступ.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--c-border)]">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-[color:var(--c-surface-2)] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Клиент</th>
                <th className="px-4 py-3 font-medium">Проекты</th>
                <th className="px-4 py-3 font-medium">Доступ</th>
                <th className="px-4 py-3 font-medium">Создан</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-[color:var(--c-border)]">
                  <td className="px-4 py-3">
                    <div>{c.display_name}</div>
                    {c.company ? (
                      <div className="text-xs text-[color:var(--c-text-muted)]">{c.company}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{c.projects_count}</td>
                  <td className="px-4 py-3">
                    {c.has_login ? <Badge variant="tech">выдан</Badge> : <Badge variant="muted">нет входа</Badge>}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--c-text-muted)]">{shortDate(c.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {c.has_login ? (
                        <Button type="button" disabled={busy === c.id} onClick={() => onReset(c)}>
                          {busy === c.id ? "…" : "Перевыпустить пароль"}
                        </Button>
                      ) : (
                        <Button type="button" disabled={busy === c.id} onClick={() => onGrant(c)}>
                          {busy === c.id ? "…" : "Выдать доступ"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Карточка с выданными данными входа. Показывается один раз — потом не восстановить. */
function CredentialsCard({ creds, onClose }: { creds: Credentials; onClose: () => void }) {
  return (
    <div className="rounded-2xl border border-[color:var(--c-lime)]/60 bg-[color:var(--c-surface-2)] p-6">
      <h2 className="mb-2 text-lg font-semibold text-[color:var(--c-lime)]">Данные для входа</h2>
      <p className="mb-4 text-sm text-[color:var(--c-text-muted)]">
        {creds.warning || "Пароль показывается один раз. Передайте его клиенту и закройте это окно."}
      </p>
      <dl className="space-y-2 font-mono text-sm">
        <div className="flex flex-wrap gap-2">
          <dt className="text-[color:var(--c-text-muted)]">Почта:</dt>
          <dd>{creds.email}</dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="text-[color:var(--c-text-muted)]">Пароль:</dt>
          <dd className="select-all font-semibold">{creds.password}</dd>
        </div>
      </dl>
      <div className="mt-5">
        <Button type="button" onClick={onClose}>Я сохранил пароль</Button>
      </div>
    </div>
  );
}
