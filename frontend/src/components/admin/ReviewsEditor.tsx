/** CMS-редактор отзывов: список, создание, согласие, публикация. */
/** Манифест: docs/manifests/ui/admin-reviews.md */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

type Item = {
  id: number;
  author_name: string;
  author_position: string | null;
  text: string;
  project_title: string | null;
  consent_given: boolean;
  consent_at: string | null;
  consent_version: string | null;
  status: string;
  published_at: string | null;
  sort_order: number;
  visible_on_site: boolean;
};

type Draft = {
  author_name: string;
  author_position: string;
  text: string;
  project_title: string;
  consent_given: boolean;
  consent_version: string;
  status: string;
  sort_order: string;
};

const EMPTY: Draft = {
  author_name: "", author_position: "", text: "", project_title: "",
  consent_given: false, consent_version: "1.0", status: "draft", sort_order: "0",
};

/** Переводит запись в черновик формы. */
function toDraft(a: Item): Draft {
  return {
    author_name: a.author_name ?? "",
    author_position: a.author_position ?? "",
    text: a.text ?? "",
    project_title: a.project_title ?? "",
    consent_given: a.consent_given,
    consent_version: a.consent_version ?? "",
    status: a.status,
    sort_order: String(a.sort_order),
  };
}

/** Редактор отзывов клиентов. */
export function ReviewsEditor() {
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Загружает список отзывов. */
  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/reviews", { credentials: "include", cache: "no-store" });
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

  /** Открывает форму для нового отзыва. */
  function startCreate() {
    setEditingId(null);
    setCreating(true);
    setDraft(EMPTY);
    setError(null);
    setNotice(null);
  }

  /** Открывает форму правки. */
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

  /** Собирает тело запроса с проверкой обязательных полей. */
  function buildPayload(): Record<string, unknown> | null {
    if (!draft.author_name.trim()) { setError("Укажите имя автора"); return null; }
    if (!draft.text.trim()) { setError("Заполните текст отзыва"); return null; }
    const order = Number(draft.sort_order.replace(/\s/g, ""));
    return {
      author_name: draft.author_name.trim(),
      author_position: draft.author_position.trim(),
      text: draft.text.trim(),
      project_title: draft.project_title.trim(),
      consent_given: draft.consent_given,
      consent_version: draft.consent_version.trim(),
      status: draft.status,
      sort_order: Number.isFinite(order) ? Math.round(order) : 0,
    };
  }

  /** Сохраняет отзыв. */
  async function save() {
    const payload = buildPayload();
    if (!payload) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const url = BASE_PATH + "/api/v1/admin/reviews" + (editingId ? "/" + editingId : "");
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.detail === "string" ? body.detail : "Не удалось сохранить");
        return;
      }
      const saved = await res.json();
      if (!saved.consent_given && draft.status === "published") {
        setNotice("Сохранено. Без согласия отзыв на сайте не покажется");
      } else {
        setNotice(editingId ? "Отзыв сохранён" : "Отзыв создан");
      }
      cancel();
      await load();
    } catch { setError("Сеть недоступна"); }
    finally { setBusy(false); }
  }

  /** Удаляет отзыв сразу, без подтверждения. */
  async function remove(a: Item) {
    setError(null);
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/reviews/" + a.id, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) { setError("Не удалось удалить"); return; }
      setItems((prev) => prev.filter((x) => x.id !== a.id));
      setNotice("Отзыв удалён");
    } catch { setError("Сеть недоступна"); }
  }

  const formOpen = creating || editingId !== null;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[color:var(--c-warning)]/40 bg-[color:var(--c-warning)]/5 p-3 text-sm text-[color:var(--c-muted)]">
        Отзыв попадает на сайт только при включённом согласии автора. Если согласие снять,
        отзыв автоматически снимается с публикации.
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={startCreate} disabled={busy}>Новый отзыв</Button>
        <Button variant="secondary" onClick={() => void load()} disabled={busy}>Обновить</Button>
        {notice ? <span className="text-sm text-[color:var(--c-terra-ink)]">{notice}</span> : null}
        {error ? <span role="alert" className="text-sm text-[color:var(--c-danger)]">{error}</span> : null}
      </div>

      {formOpen ? (
        <section className="rounded-2xl border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-5 space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? "Редактирование отзыва" : "Новый отзыв"}</h2>
          <TextField
            id="author_name"
            label="Имя или компания"
            required
            value={draft.author_name}
            onChange={(e) => setDraft({ ...draft, author_name: e.target.value })}
          />
          <TextField
            id="author_position"
            label="Должность"
            value={draft.author_position}
            onChange={(e) => setDraft({ ...draft, author_position: e.target.value })}
          />
          <TextAreaField
            id="text"
            label="Текст отзыва"
            required
            rows={6}
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          />
          <TextField
            id="project_title"
            label="Проект"
            hint="По какому проекту оставлен отзыв"
            value={draft.project_title}
            onChange={(e) => setDraft({ ...draft, project_title: e.target.value })}
          />
          <div className="rounded-xl border border-[color:var(--c-line)] p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.consent_given}
                onChange={(e) => setDraft({ ...draft, consent_given: e.target.checked })}
                className="h-4 w-4"
              />
              Автор дал согласие на публикацию
            </label>
            <TextField
              id="consent_version"
              label="Версия согласия"
              hint="Редакция текста согласия, которую подписал автор"
              value={draft.consent_version}
              onChange={(e) => setDraft({ ...draft, consent_version: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="status"
              label="Статус"
              value={draft.status}
              options={[
                { value: "draft", label: "Черновик" },
                { value: "published", label: "Опубликован" },
                { value: "archived", label: "В архиве" },
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
          <div className="flex gap-3">
            <Button onClick={() => void save()} disabled={busy}>{busy ? "Сохраняю…" : "Сохранить"}</Button>
            <Button variant="secondary" onClick={cancel} disabled={busy}>Отмена</Button>
          </div>
        </section>
      ) : null}

      {state === "loading" ? <p className="text-sm text-[color:var(--c-muted)]">Загружаю…</p> : null}
      {state === "error" ? (
        <div className="space-y-2">
          <p className="text-sm text-[color:var(--c-danger)]">Не удалось загрузить список отзывов</p>
          <Button variant="secondary" onClick={() => void load()}>Повторить</Button>
        </div>
      ) : null}
      {state === "ready" && items.length === 0 ? (
        <p className="text-sm text-[color:var(--c-muted)]">
          Отзывов пока нет. Это нормально: блок на сайте просто не показывается.
          Когда появится первый — нажмите «Новый отзыв».
        </p>
      ) : null}

      {state === "ready" && items.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--c-line)]">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--c-paper)] text-left text-[color:var(--c-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Автор</th>
                <th className="px-4 py-3 font-medium">Согласие</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">На сайте</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-[color:var(--c-line)]">
                  <td className="px-4 py-3">
                    <div>{a.author_name}</div>
                    {a.author_position ? (
                      <div className="text-xs text-[color:var(--c-muted)]">{a.author_position}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={a.consent_given ? "tech" : "muted"}>
                      {a.consent_given ? "Есть" : "Нет"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="muted">
                      {a.status === "published" ? "Опубликован" : a.status === "archived" ? "В архиве" : "Черновик"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={a.visible_on_site ? "price" : "muted"}>
                      {a.visible_on_site ? "Виден" : "Скрыт"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={() => startEdit(a)}>Изменить</Button>
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
