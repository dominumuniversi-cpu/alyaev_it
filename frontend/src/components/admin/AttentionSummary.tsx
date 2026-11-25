/** Сводка «Требует внимания» на главной админки. Манифест: docs/manifests/ui/admin-projects.md. */

"use client";

import { useEffect, useState } from "react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

type Summary = {
  new_leads: number;
  client_messages: number;
  stale_projects: number;
};

type Item = { key: keyof Summary; label: string; href: string };

const ITEMS: Item[] = [
  { key: "new_leads", label: "Новые заявки", href: "/admin" },
  { key: "client_messages", label: "Проекты с перепиской", href: "/admin/projects" },
  { key: "stale_projects", label: "Без движения больше недели", href: "/admin/projects" },
];

/** Считается на сервере одним запросом на показатель. */
export function AttentionSummary() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(BASE_PATH + "/api/v1/admin/attention", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
      .then((json) => { if (alive) setData(json as Summary); })
      .catch(() => { /* сводка необязательна: её отсутствие не должно ломать заявки */ });
    return () => { alive = false; };
  }, []);

  if (data === null) return null;

  const visible = ITEMS.filter((item) => data[item.key] > 0);
  // Всё по нулям — плашку не показываем: пустое сообщение только шумит.
  if (visible.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 rounded-[var(--radius-lg)] border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--c-muted)]">
        Требует внимания
      </h2>
      <ul className="flex flex-wrap gap-3">
        {visible.map((item) => (
          <li key={item.key}>
            <a
              href={BASE_PATH + item.href}
              className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--c-line)] px-4 py-2 text-sm hover:border-[color:var(--c-lime-ink)]"
            >
              <span className="font-semibold text-[color:var(--c-lime-ink)]">{data[item.key]}</span>
              <span className="text-[color:var(--c-muted)]">{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
