/** Список заявок в админке: фильтры, статусы, смена статуса без перезагрузки. */

"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

type Lead = {
  public_id: string;
  name: string;
  contact_type: string;
  contact_value: string;
  task_type: string | null;
  message: string;
  company_site: string | null;
  brief: Record<string, string>;
  source_page: string | null;
  status: string;
  created_at: string | null;
};

/** Подписи вопросов брифа. Порядок фиксирован — читается как ответ, а не как дамп JSON. */
const BRIEF_LABELS: [string, string][] = [
  ["Сейчас", "current"],
  ["Связать", "systems"],
  ["Результат", "result"],
  ["Сотрудников", "staff"],
  ["ТЗ", "tech_task"],
  ["Бюджет", "budget"],
];

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  qualified: "Квалифицирована",
  proposal: "Предложение",
  won: "Выиграна",
  lost: "Отказ",
  spam: "Спам",
};

/** Человекочитаемая дата заявки. */
function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Таблица заявок с фильтром по статусу. */
export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<string>("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  /** Загружает заявки с учётом фильтра. */
  const load = useCallback(async () => {
    setState("loading");
    try {
      const url = BASE_PATH + "/api/v1/admin/leads" + (filter ? "?status=" + filter : "");
      const res = await fetch(url, { credentials: "include", cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        window.location.assign(BASE_PATH + "/login/");
        return;
      }
      if (!res.ok) {
        setState("error");
        return;
      }
      const data = await res.json();
      setLeads(data.items ?? []);
      setCounts(data.counts ?? {});
      setState("ready");
    } catch {
      setState("error");
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Меняет статус заявки и обновляет строку на месте. */
  async function changeStatus(publicId: string, next: string) {
    setBusy(publicId);
    setMessage(null);
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/leads/" + publicId + "/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setMessage("Не удалось изменить статус");
        return;
      }
      await load();
      setMessage("Статус обновлён");
    } catch {
      setMessage("Сеть недоступна");
    } finally {
      setBusy(null);
    }
  }

  const statuses = ["", "new", "in_progress", "qualified", "proposal", "won", "lost", "spam"];

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {statuses.map((status) => (
          <button
            key={status || "all"}
            type="button"
            onClick={() => setFilter(status)}
            className={"rounded-lg border px-3 py-1.5 text-sm transition-colors " + (filter === status ? "border-[color:var(--c-lime-ink)] text-[color:var(--c-lime-ink)]" : "border-[color:var(--c-line)] text-[color:var(--c-muted)] hover:text-[color:var(--c-ink)]")}
          >
            {status ? STATUS_LABELS[status] : "Все"}
            {" (" + (status ? (counts[status] ?? 0) : Object.values(counts).reduce((a, b) => a + b, 0)) + ")"}
          </button>
        ))}
      </div>

      {message ? (
        <p className="mb-4 text-sm text-[color:var(--c-muted)]" role="status">{message}</p>
      ) : null}

      {state === "loading" ? (
        <p className="text-sm text-[color:var(--c-muted)]">Загружаем заявки…</p>
      ) : null}
      {state === "error" ? (
        <p className="text-sm text-[color:var(--c-danger)]">Не удалось загрузить список. Обновите страницу.</p>
      ) : null}

      {state === "ready" && leads.length === 0 ? (
        <p className="rounded-xl border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-6 text-sm text-[color:var(--c-muted)]">
          Заявок пока нет. Они появятся здесь, как только кто-то отправит форму на сайте.
        </p>
      ) : null}

      <div className="space-y-4">
        {leads.map((lead) => (
          <article key={lead.public_id} className="rounded-xl border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-5">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold">{lead.name}</h2>
              <Badge variant="status">{STATUS_LABELS[lead.status] ?? lead.status}</Badge>
              <span className="text-xs text-[color:var(--c-muted)]">{formatDate(lead.created_at)}</span>
            </div>
            <p className="mb-2 text-sm text-[color:var(--c-lime-ink)]">{lead.contact_value}</p>
            <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--c-muted)]">{lead.message}</p>
            <div className="mb-3 flex flex-wrap gap-3 text-xs text-[color:var(--c-muted)]">
              {lead.task_type ? <span>Задача: {lead.task_type}</span> : null}
              {lead.company_site ? <span>Сайт: {lead.company_site}</span> : null}
              {lead.source_page ? <span>Источник: {lead.source_page}</span> : null}
            </div>
            {/* Ответы брифа: клиент выбрал их сам — без них смысл брифа теряется. */}
            {Object.keys(lead.brief ?? {}).length > 0 ? (
              <dl className="mb-3 grid gap-1 text-xs text-[color:var(--c-muted)] sm:grid-cols-2">
                {BRIEF_LABELS.filter(([, key]) => lead.brief[key]).map(([label, key]) => (
                  <div key={key}>
                    <dt className="inline">{label}: </dt>
                    <dd className="inline text-[color:var(--c-ink)]">{lead.brief[key]}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {["in_progress", "won", "lost", "spam"].map((next) => (
                <Button
                  key={next}
                  variant="secondary"
                  disabled={busy === lead.public_id || lead.status === next}
                  onClick={() => void changeStatus(lead.public_id, next)}
                >
                  {STATUS_LABELS[next]}
                </Button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}