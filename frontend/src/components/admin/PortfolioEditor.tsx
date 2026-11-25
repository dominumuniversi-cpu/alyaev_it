/** CMS-редактор портфолио: список кейсов, создание, правка, публикация. */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

type Item = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  problem_md: string;
  solution_md: string;
  technologies: string[];
  status: string;
  published: boolean;
  sort_order: number;
};

type Draft = {
  slug: string;
  title: string;
  summary: string;
  problem_md: string;
  solution_md: string;
  technologies: string;
  status: string;
  published: boolean;
  sort_order: string;
};

const EMPTY: Draft = {
  slug: "", title: "", summary: "", problem_md: "", solution_md: "",
  technologies: "", status: "demo", published: false, sort_order: "0",
};

/** Подписи статусов совпадают с тем, что видит посетитель на сайте. */
const STATUS_LABELS: Record<string, string> = {
  demo: "Демонстрационный проект",
  own: "Собственный проект",
  commercial: "Коммерческое внедрение",
};

/** Переводит запись в черновик формы. */
function toDraft(a: Item): Draft {
  return {
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    problem_md: a.problem_md,
    solution_md: a.solution_md,
    technologies: (a.technologies ?? []).join(", "),
    status: a.status,
    published: a.published,
    sort_order: String(a.sort_order),
  };
}

/** Редактор кейсов портфолио. Манифест: docs/manifests/ui/admin-content.md */
export function PortfolioEditor() {
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Загружает список кейсов. */
  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/content/portfolio", { credentials: "include", cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        window.location.assign(BASE_PATH + "/login/");
        return;
      }
      if (!res.ok) { setState("error"); return; }
      const data = await res.json();
      setItems(data.items ?? []);
      setState("ready");
    } catch { setState("error"); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  /** Открывает форму для нового кейса. */
  function startCreate() {
    setEditingId(null);
    setCreating(true);
    setDraft(EMPTY);
    setError(null);
    setNotice(null);
  }

  /** Открывает форму правки существующего кейса. */
  function startEdit(a: Item) {
    setCreating(false);
    setEditingId(a.id);
    setDraft(toDraft(a));
    setError(null);
    setNotice(null);
  }

  /** Закрывает форму без сохранения. */
  function cancel() {
    setCreating(false);
    setEditingId(null);
    setError(null);
  }

  /** Собирает тело запроса из формы с проверкой обязательных полей. */
  function buildPayload(): Record<string, unknown> | null {
    if (!draft.slug.trim()) { setError("Заполните адрес страницы (slug)"); return null; }
    if (!draft.title.trim()) { setError("Заполните название"); return null; }
    if (!draft.summary.trim()) { setError("Заполните краткое описание"); return null; }
    const order = Number(draft.sort_order.replace(/\s/g, ""));
    const tech = draft.technologies.split(",").map((t) => t.trim()).filter(Boolean);
    return {
      slug: draft.slug.trim().toLowerCase(),
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      problem_md: draft.problem_md,
      solution_md: draft.solution_md,
      technologies: tech,
      status: draft.status,
      published: draft.published,
      sort_order: Number.isFinite(order) ? Math.round(order) : 0,
    };
  }

  /** Сохраняет кейс: создаёт новый или обновляет текущий. */
  async function save() {
    const payload = buildPayload();
    if (!payload) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const url = BASE_PATH + "/api/v1/admin/content/portfolio" + (editingId ? "/" + editingId : "");
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (res.status === 409) { setError("Такой адрес уже занят другим кейсом"); }
        else { setError("Не удалось сохранить"); }
        return;
      }
      setNotice(editingId ? "Кейс сохранён" : "Кейс создан");
      cancel();
      await load();
    } catch { setError("Сеть недоступна"); }
    finally { setBusy(false); }
  }

  /** Быстрое переключение публикации без открытия формы. */
  async function togglePublished(a: Item) {
    setError(null);
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/content/portfolio/" + a.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ published: !a.published }),
      });
      if (!res.ok) { setError("Не удалось изменить публикацию"); return; }
      await load();
    } catch { setError("Сеть недоступна"); }
  }

  /** Удаляет кейс сразу, без подтверждения — по правилу интерфейса. */
  async function remove(a: Item) {
    setError(null);
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/content/portfolio/" + a.id, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) { setError("Не удалось удалить"); return; }
      setItems((prev) => prev.filter((x) => x.id !== a.id));
      setNotice("Кейс удалён");
    } catch { setError("Сеть недоступна"); }
  }

  const formOpen = creating || editingId !== null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={startCreate} disabled={busy}>Новый кейс</Button>
        <Button variant="secondary" onClick={() => void load()} disabled={busy}>Обновить</Button>
        {notice ? <span className="text-sm text-[color:var(--c-terra-ink)]">{notice}</span> : null}
        {error ? <span role="alert" className="text-sm text-[color:var(--c-danger)]">{error}</span> : null}
      </div>

      {formOpen ? (
        <section className="rounded-2xl border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-5 space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? "Редактирование кейса" : "Новый кейс"}</h2>
          <TextField
            id="slug"
            label="Адрес страницы"
            hint="Латиница, цифры и дефис. Например: telegram-ai-konsultant"
            required
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
          />
          <TextField
            id="title"
            label="Название"
            required
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <TextAreaField
            id="summary"
            label="Краткое описание"
            hint="Одна-две строки для карточки в списке, до 320 символов"
            rows={3}
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
          />
          <TextAreaField
            id="problem_md"
            label="Какую задачу решает"
            hint="Markdown. Без выдуманных цифр экономии — только реальный результат"
            rows={6}
            value={draft.problem_md}
            onChange={(e) => setDraft({ ...draft, problem_md: e.target.value })}
          />
          <TextAreaField
            id="solution_md"
            label="Как устроено решение"
            hint="Markdown. Архитектура, что с чем связано"
            rows={6}
            value={draft.solution_md}
            onChange={(e) => setDraft({ ...draft, solution_md: e.target.value })}
          />
          <TextField
            id="technologies"
            label="Технологии"
            hint="Через запятую: Python, FastAPI, PostgreSQL, Telegram Bot API"
            value={draft.technologies}
            onChange={(e) => setDraft({ ...draft, technologies: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="status"
              label="Статус проекта"
              hint="Честный статус — требование ТЗ"
              value={draft.status}
              options={[
                { value: "demo", label: "Демонстрационный проект" },
                { value: "own", label: "Собственный проект" },
                { value: "commercial", label: "Коммерческое внедрение" },
              ]}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            />
            <TextField
              id="sort_order"
              label="Порядок"
              hint="Меньше — выше в списке"
              inputMode="numeric"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
              className="h-4 w-4 rounded border-[color:var(--c-line)]"
            />
            Показывать на сайте
          </label>
          <div className="flex gap-3">
            <Button onClick={() => void save()} disabled={busy}>{busy ? "Сохраняю…" : "Сохранить"}</Button>
            <Button variant="secondary" onClick={cancel} disabled={busy}>Отмена</Button>
          </div>
        </section>
      ) : null}

      {state === "loading" ? <p className="text-sm text-[color:var(--c-muted)]">Загружаю…</p> : null}
      {state === "error" ? (
        <div className="space-y-2">
          <p className="text-sm text-[color:var(--c-danger)]">Не удалось загрузить список</p>
          <Button variant="secondary" onClick={() => void load()}>Повторить</Button>
        </div>
      ) : null}
      {state === "ready" && items.length === 0 ? (
        <p className="text-sm text-[color:var(--c-muted)]">
          Кейсов пока нет. Нажмите «Новый кейс», чтобы добавить первый.
        </p>
      ) : null}

      {state === "ready" && items.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--c-line)]">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--c-paper)] text-left text-[color:var(--c-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Название</th>
                <th className="px-4 py-3 font-medium">Адрес</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Публикация</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-[color:var(--c-line)]">
                  <td className="px-4 py-3">{a.title}</td>
                  <td className="px-4 py-3 text-[color:var(--c-muted)]">/portfolio/{a.slug}</td>
                  <td className="px-4 py-3">
                    <Badge variant="muted">{STATUS_LABELS[a.status] ?? a.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={a.published ? "tech" : "muted"}>
                      {a.published ? "На сайте" : "Скрыт"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={() => startEdit(a)}>Изменить</Button>
                      <Button variant="ghost" onClick={() => void togglePublished(a)}>
                        {a.published ? "Скрыть" : "Показать"}
                      </Button>
                      <Button variant="ghost" onClick={() => void remove(a)}>Удалить</Button>
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
