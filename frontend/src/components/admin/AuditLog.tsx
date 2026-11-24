/** Журнал действий администраторов: лента изменений. ТЗ 12.5. */
/** Манифест: docs/manifests/ui/audit-log.md */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Field";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

type Entry = {
  id: number;
  created_at: string | null;
  actor: string;
  action: string;
  action_label: string;
  entity: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
};

type State = "loading" | "ready" | "error";

/** Дата в виде «24.11.2026, 15:42» — читаемая, без машинного ISO. */
function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear() +
    ", " + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

/** Изменения из payload: только изменившиеся поля, без служебного шума. */
function changesOf(payload: Record<string, unknown>): string[] {
  const raw = payload.changes;
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw as Record<string, unknown>).map(([field, value]) => {
    if (value && typeof value === "object" && "было" in (value as object)) {
      const v = value as { было: unknown; стало: unknown };
      return field + ": " + String(v.было) + " → " + String(v.стало);
    }
    return field + ": " + String(value);
  });
}

/** Лента журнала с фильтрами по сущности и действию. */
export function AuditLog() {
  const [items, setItems] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [entities, setEntities] = useState<string[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [entity, setEntity] = useState("");
  const [state, setState] = useState<State>("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const query = entity ? "?entity=" + encodeURIComponent(entity) : "";
      const res = await fetch(BASE_PATH + "/api/v1/admin/audit" + query, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401 || res.status === 403) {
        window.location.assign(BASE_PATH + "/login/");
        return;
      }
      if (!res.ok) { setState("error"); return; }
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
      setEntities(Array.isArray(data.entities) ? data.entities : []);
      setLabels(data.actions && typeof data.actions === "object" ? data.actions : {});
      setState("ready");
    } catch {
      setState("error");
    }
  }, [entity]);

  useEffect(() => { void load(); }, [load]);

  if (state === "loading" && items.length === 0) {
    return <p className="text-sm text-[color:var(--c-text-muted)]">Загружаем журнал…</p>;
  }
  if (state === "error") {
    return (
      <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
        <p className="mb-4 text-sm">Не удалось загрузить журнал.</p>
        <Button onClick={() => void load()}>Повторить</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <SelectField
          id="audit-entity"
          label="Что показать"
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          options={[
            { value: "", label: "Все изменения" },
            ...entities.map((e) => ({ value: e, label: e })),
          ]}
        />
        <Button variant="secondary" onClick={() => void load()}>Обновить</Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
          <p className="text-sm text-[color:var(--c-text-muted)]">
            Изменений пока не было. Здесь появятся создание и правка услуг, статей,
            кейсов, отзывов, SEO и семантики — с указанием, кто их сделал.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-[color:var(--c-text-muted)]">
            Всего записей: {total}. Показаны последние {items.length}.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[color:var(--c-border)] text-left">
                  <th className="py-2 pr-4 font-medium">Когда</th>
                  <th className="py-2 pr-4 font-medium">Кто</th>
                  <th className="py-2 pr-4 font-medium">Что</th>
                  <th className="py-2 pr-4 font-medium">Объект</th>
                  <th className="py-2 font-medium">Изменения</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const changes = changesOf(row.payload);
                  return (
                    <tr key={row.id} className="border-b border-[color:var(--c-border)] align-top">
                      <td className="py-3 pr-4 whitespace-nowrap">{formatDate(row.created_at)}</td>
                      <td className="py-3 pr-4">{row.actor}</td>
                      <td className="py-3 pr-4">{labels[row.action] ?? row.action_label}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="muted">{row.entity}</Badge>
                        {row.entity_id ? <span className="ml-1 opacity-60">#{row.entity_id}</span> : null}
                      </td>
                      <td className="py-3 text-[color:var(--c-text-muted)]">
                        {changes.length > 0 ? (
                          <ul className="space-y-1">
                            {changes.map((c) => <li key={c}>{c}</li>)}
                          </ul>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
