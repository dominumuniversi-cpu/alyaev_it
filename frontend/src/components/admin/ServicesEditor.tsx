/** Управление услугами и ценами в админке. */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

type Service = {
  id: number;
  slug: string;
  title: string;
  price_from: number | null;
  price_on_request: boolean;
  duration_text: string;
  status: string;
};

/** Список услуг с правкой цены, срока и публикации. */
export function ServicesEditor() {
  const [items, setItems] = useState<Service[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [drafts, setDrafts] = useState<Record<number, { price: string; duration: string }>>({});
  const [saved, setSaved] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Загружает услуги и заполняет черновики полей. */
  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/services", { credentials: "include", cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        window.location.assign(BASE_PATH + "/login/");
        return;
      }
      if (!res.ok) { setState("error"); return; }
      const data = await res.json();
      const list: Service[] = data.items ?? [];
      setItems(list);
      const next: Record<number, { price: string; duration: string }> = {};
      for (const service of list) {
        next[service.id] = { price: service.price_from?.toString() ?? "", duration: service.duration_text ?? "" };
      }
      setDrafts(next);
      setState("ready");
    } catch { setState("error"); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  /** Сохраняет изменения одной услуги без перезагрузки страницы. */
  async function save(service: Service) {
    const draft = drafts[service.id];
    setError(null);
    setSaved(null);
    const payload: Record<string, unknown> = { duration_text: draft.duration };
    if (draft.price.trim() === "") {
      payload.price_on_request = true;
    } else {
      const value = Number(draft.price.replace(/\s/g, ""));
      if (!Number.isFinite(value) || value < 0) {
        setError("Цена должна быть неотрицательным числом");
        return;
      }
      payload.price_from = Math.round(value);
      payload.price_on_request = false;
    }
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/services/" + service.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) { setError("Не удалось сохранить"); return; }
      setSaved(service.id);
      await load();
    } catch { setError("Сеть недоступна"); }
  }

  /** Переключает публикацию услуги. */
  async function togglePublish(service: Service) {
    const next = service.status === "published" ? "draft" : "published";
    setError(null);
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/services/" + service.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) { setError("Не удалось изменить публикацию"); return; }
      await load();
    } catch { setError("Сеть недоступна"); }
  }

  if (state === "loading") return <p className="text-sm text-[color:var(--c-text-muted)]">Загружаем услуги…</p>;
  if (state === "error") return <p className="text-sm text-[color:var(--c-danger)]">Не удалось загрузить услуги.</p>;

  return (
    <div>
      {error ? <p role="alert" className="mb-4 text-sm text-[color:var(--c-danger)]">{error}</p> : null}
      <div className="space-y-3">
        {items.map((service) => (
          <div key={service.id} className="rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-5">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h3 className="text-base font-semibold">{service.title}</h3>
              <span className="text-xs text-[color:var(--c-text-muted)]">
                {service.status === "published" ? "опубликована" : "черновик"}
              </span>
              {saved === service.id ? (
                <span role="status" className="text-xs text-[color:var(--c-success)]">сохранено</span>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-[160px_200px_auto_auto] sm:items-end">
              <TextField
                id={"price-" + service.id}
                label="Цена от, ₽"
                placeholder="пусто = по запросу"
                value={drafts[service.id]?.price ?? ""}
                onChange={(event) =>
                  setDrafts((prev) => ({ ...prev, [service.id]: { ...prev[service.id], price: event.target.value } }))
                }
              />
              <TextField
                id={"duration-" + service.id}
                label="Срок"
                value={drafts[service.id]?.duration ?? ""}
                onChange={(event) =>
                  setDrafts((prev) => ({ ...prev, [service.id]: { ...prev[service.id], duration: event.target.value } }))
                }
              />
              <Button variant="secondary" onClick={() => void save(service)}>Сохранить</Button>
              <Button
                variant="ghost"
                onClick={() => void togglePublish(service)}
              >
                {service.status === "published" ? "Снять с публикации" : "Опубликовать"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}