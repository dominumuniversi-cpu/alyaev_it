/** CMS-редактор семантического ядра: запросы, группы, целевые страницы, позиции. */
/** Манифест: docs/manifests/ui/semantic-core.md */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField, INPUT_CLASS } from "@/components/ui/Field";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

type Item = {
  id: number;
  query: string;
  group_slug: string;
  target_path: string;
  priority: string;
  frequency: number | null;
  frequency_source: string | null;
  difficulty: number | null;
  region: string;
  position: number | null;
  position_checked_at: string | null;
  cluster: string | null;
  notes: string;
};

type Draft = {
  query: string;
  group_slug: string;
  target_path: string;
  priority: string;
  frequency: string;
  frequency_source: string;
  difficulty: string;
  region: string;
  cluster: string;
  notes: string;
};

const GROUP_LABELS: Record<string, string> = {
  telegram: "Telegram-боты",
  ai: "AI-ассистенты",
  rag: "Базы знаний / RAG",
  automation: "Автоматизация",
  parsers: "Парсеры",
  integrations: "Интеграции",
  websites: "Сайты",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const EMPTY: Draft = {
  query: "", group_slug: "telegram", target_path: "", priority: "medium",
  frequency: "", frequency_source: "", difficulty: "", region: "ru",
  cluster: "", notes: "",
};

/** Переводит запись в черновик формы: пустые числа остаются пустыми, а не нулями. */
function toDraft(a: Item): Draft {
  return {
    query: a.query ?? "",
    group_slug: a.group_slug,
    target_path: a.target_path ?? "",
    priority: a.priority,
    frequency: a.frequency === null ? "" : String(a.frequency),
    frequency_source: a.frequency_source ?? "",
    difficulty: a.difficulty === null ? "" : String(a.difficulty),
    region: a.region ?? "ru",
    cluster: a.cluster ?? "",
    notes: a.notes ?? "",
  };
}

/** Пустая строка превращается в null: «не измеряли» не должно стать нулём. */
function numOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** Собирает тело запроса из черновика. */
function toBody(d: Draft) {
  return {
    query: d.query.trim(),
    group_slug: d.group_slug,
    target_path: d.target_path.trim(),
    priority: d.priority,
    frequency: numOrNull(d.frequency),
    frequency_source: d.frequency_source.trim() || null,
    difficulty: numOrNull(d.difficulty),
    region: d.region.trim() || "ru",
    cluster: d.cluster.trim() || null,
    notes: d.notes.trim(),
  };
}

/** Редактор семантического ядра. */
export function SemanticEditor() {
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [groupFilter, setGroupFilter] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Загружает список запросов с учётом фильтра по группе. */
  const load = useCallback(async () => {
    setState("loading");
    try {
      const url = BASE_PATH + "/api/v1/admin/semantic" + (groupFilter ? "?group=" + groupFilter : "");
      const res = await fetch(url, { credentials: "include", cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        window.location.assign(BASE_PATH + "/login/");
        return;
      }
      if (!res.ok) { setState("error"); return; }
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [groupFilter]);

  useEffect(() => { void load(); }, [load]);

  /** Открывает форму для нового запроса. */
  function startCreate() {
    setEditingId(null);
    setCreating(true);
    setDraft(EMPTY);
    setError(null);
    setNotice(null);
  }

  /** Открывает форму для правки существующего запроса. */
  function startEdit(item: Item) {
    setCreating(false);
    setEditingId(item.id);
    setDraft(toDraft(item));
    setError(null);
    setNotice(null);
  }

  /** Закрывает форму без сохранения. */
  function cancel() {
    setCreating(false);
    setEditingId(null);
    setError(null);
  }

  /** Сохраняет запрос: создание или правку. */
  async function save() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const isEdit = editingId !== null;
      const res = await fetch(
        BASE_PATH + "/api/v1/admin/semantic" + (isEdit ? "/" + editingId : ""),
        {
          method: isEdit ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toBody(draft)),
        },
      );
      if (res.status === 401 || res.status === 403) {
        window.location.assign(BASE_PATH + "/login/");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.detail === "string" ? data.detail : "Не удалось сохранить запрос");
        return;
      }
      setNotice(isEdit ? "Запрос обновлён" : "Запрос добавлен");
      setCreating(false);
      setEditingId(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  /** Записывает позицию и дату проверки. Пустое поле — «выпал из выдачи». */
  async function savePosition(item: Item, raw: string) {
    setBusy(true);
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/semantic/" + item.id + "/position", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: numOrNull(raw) }),
      });
      if (res.status === 401 || res.status === 403) {
        window.location.assign(BASE_PATH + "/login/");
        return;
      }
      if (!res.ok) { setError("Не удалось записать позицию"); return; }
      setNotice("Позиция записана с датой проверки");
      await load();
    } finally {
      setBusy(false);
    }
  }

  /** Удаляет запрос без подтверждения: это рабочий список, восстановить можно заново. */
  async function remove(item: Item) {
    setBusy(true);
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/semantic/" + item.id, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401 || res.status === 403) {
        window.location.assign(BASE_PATH + "/login/");
        return;
      }
      if (!res.ok) { setError("Не удалось удалить запрос"); return; }
      setNotice("Запрос «" + item.query + "» удалён");
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } finally {
      setBusy(false);
    }
  }

  const formOpen = creating || editingId !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <SelectField
            id="semantic-group-filter"
            label="Группа"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            options={[
              { value: "", label: "Все группы" },
              ...Object.entries(GROUP_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>
        <Button variant="primary" onClick={startCreate} disabled={busy}>Добавить запрос</Button>
      </div>

      {notice ? <p className="text-sm text-[color:var(--c-terra-ink)]">{notice}</p> : null}
      {error ? <p role="alert" className="text-sm text-[color:var(--c-danger)]">{error}</p> : null}

      {formOpen ? (
        <form
          className="space-y-4 rounded-[14px] border border-[color:var(--c-line)] p-5"
          onSubmit={(e) => { e.preventDefault(); void save(); }}
        >
          <h3 className="text-base font-semibold text-[color:var(--c-ink)]">
            {creating ? "Новый запрос" : "Правка запроса"}
          </h3>
          <TextField id="q-query" label="Поисковый запрос" required maxLength={200}
            value={draft.query} onChange={(e) => setDraft({ ...draft, query: e.target.value })} />
          <SelectField id="q-group" label="Группа" required value={draft.group_slug}
            onChange={(e) => setDraft({ ...draft, group_slug: e.target.value })}
            options={Object.entries(GROUP_LABELS).map(([value, label]) => ({ value, label }))} />
          <TextField id="q-target" label="Целевая страница" required maxLength={255}
            hint="Например: /services/telegram-bots — без замыкающего слеша"
            value={draft.target_path} onChange={(e) => setDraft({ ...draft, target_path: e.target.value })} />
          <SelectField id="q-priority" label="Приоритет" required value={draft.priority}
            onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
            options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))} />
          <TextField id="q-frequency" label="Частотность" type="number" min={0}
            hint="Пусто = не измеряли. Ноль = измерили, спроса нет"
            value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value })} />
          <TextField id="q-source" label="Источник частотности" maxLength={32}
            hint="wordstat / gkp / hand" value={draft.frequency_source}
            onChange={(e) => setDraft({ ...draft, frequency_source: e.target.value })} />
          <TextField id="q-difficulty" label="Конкурентность (0–100)" type="number" min={0} max={100}
            value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value })} />
          <TextField id="q-region" label="Регион" maxLength={32} value={draft.region}
            onChange={(e) => setDraft({ ...draft, region: e.target.value })} />
          <TextField id="q-cluster" label="Кластер" maxLength={64}
            value={draft.cluster} onChange={(e) => setDraft({ ...draft, cluster: e.target.value })} />
          <TextAreaField id="q-notes" label="Заметки" maxLength={2000} value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Сохраняем…" : "Сохранить"}
            </Button>
            <Button type="button" variant="secondary" onClick={cancel} disabled={busy}>Отмена</Button>
          </div>
        </form>
      ) : null}

      {state === "loading" ? <p className="text-sm text-[color:var(--c-muted)]">Загружаем…</p> : null}
      {state === "error" ? <p className="text-sm text-[color:var(--c-danger)]">Не удалось загрузить список</p> : null}

      {state === "ready" && items.length === 0 ? (
        <p className="text-sm text-[color:var(--c-muted)]">
          Ядро пока пустое. Начните с самых частотных запросов по каждой услуге —
          по одному-двум на группу достаточно, чтобы понять, куда целиться.
        </p>
      ) : null}

      {state === "ready" && items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--c-line)] text-[color:var(--c-muted)]">
                <th className="py-2 pr-3">Запрос</th>
                <th className="py-2 pr-3">Группа</th>
                <th className="py-2 pr-3">Страница</th>
                <th className="py-2 pr-3">Част.</th>
                <th className="py-2 pr-3">Позиция</th>
                <th className="py-2 pr-3">Приоритет</th>
                <th className="py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-[color:var(--c-line)]/50">
                  <td className="py-2 pr-3 text-[color:var(--c-ink)]">{item.query}</td>
                  <td className="py-2 pr-3 text-[color:var(--c-muted)]">
                    {GROUP_LABELS[item.group_slug] ?? item.group_slug}
                  </td>
                  <td className="py-2 pr-3 text-[color:var(--c-muted)]">{item.target_path}</td>
                  <td className="py-2 pr-3 text-[color:var(--c-muted)]">
                    {item.frequency === null ? "—" : item.frequency}
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number" min={1} defaultValue={item.position ?? ""}
                      aria-label={"Позиция запроса " + item.query}
                      className={INPUT_CLASS + " w-20"}
                      onBlur={(e) => {
                        const next = e.target.value;
                        const current = item.position === null ? "" : String(item.position);
                        if (next !== current) void savePosition(item, next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Badge variant="muted">{PRIORITY_LABELS[item.priority] ?? item.priority}</Badge>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => startEdit(item)}>Править</Button>
                      <Button variant="secondary" onClick={() => void remove(item)} disabled={busy}>
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
