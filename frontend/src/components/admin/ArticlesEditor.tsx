/** CMS-редактор блога: список статей, создание, правка, публикация. */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

type Article = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  status: string;
  published_at: string | null;
  sort_order: number;
};

type Draft = {
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  status: string;
  sort_order: string;
};

const EMPTY: Draft = { slug: "", title: "", excerpt: "", body_md: "", status: "draft", sort_order: "0" };

/** Переводит запись в черновик формы. */
function toDraft(a: Article): Draft {
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    body_md: a.body_md,
    status: a.status,
    sort_order: String(a.sort_order),
  };
}

/** Редактор статей блога. Манифест: docs/manifests/ui/admin-content.md */
export function ArticlesEditor() {
  const [items, setItems] = useState<Article[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Загружает список статей. */
  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/content/articles", { credentials: "include", cache: "no-store" });
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

  /** Открывает форму для новой статьи. */
  function startCreate() {
    setEditingId(null);
    setCreating(true);
    setDraft(EMPTY);
    setError(null);
    setNotice(null);
  }

  /** Открывает форму правки существующей статьи. */
  function startEdit(a: Article) {
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
    if (!draft.title.trim()) { setError("Заполните заголовок"); return null; }
    const order = Number(draft.sort_order.replace(/\s/g, ""));
    return {
      slug: draft.slug.trim().toLowerCase(),
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim(),
      body_md: draft.body_md,
      status: draft.status,
      sort_order: Number.isFinite(order) ? Math.round(order) : 0,
    };
  }

  /** Сохраняет статью: создаёт новую или обновляет текущую. */
  async function save() {
    const payload = buildPayload();
    if (!payload) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const url = BASE_PATH + "/api/v1/admin/content/articles" + (editingId ? "/" + editingId : "");
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (res.status === 409) { setError("Такой адрес уже занят другой статьёй"); }
        else { setError("Не удалось сохранить"); }
        return;
      }
      setNotice(editingId ? "Статья сохранена" : "Статья создана");
      cancel();
      await load();
    } catch { setError("Сеть недоступна"); }
    finally { setBusy(false); }
  }

  /** Быстрое переключение публикации без открытия формы. */
  async function togglePublished(a: Article) {
    const next = a.status === "published" ? "draft" : "published";
    setError(null);
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/content/articles/" + a.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) { setError("Не удалось изменить публикацию"); return; }
      await load();
    } catch { setError("Сеть недоступна"); }
  }

  /** Удаляет статью сразу, без подтверждения — по правилу интерфейса. */
  async function remove(a: Article) {
    setError(null);
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/content/articles/" + a.id, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) { setError("Не удалось удалить"); return; }
      setItems((prev) => prev.filter((x) => x.id !== a.id));
      setNotice("Статья удалена");
    } catch { setError("Сеть недоступна"); }
  }

  const formOpen = creating || editingId !== null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={startCreate} disabled={busy}>Новая статья</Button>
        <Button variant="secondary" onClick={() => void load()} disabled={busy}>Обновить</Button>
        {notice ? <span className="text-sm text-[color:var(--c-cyan)]">{notice}</span> : null}
        {error ? <span role="alert" className="text-sm text-[#E5544B]">{error}</span> : null}
      </div>

      {formOpen ? (
        <section className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-1)] p-5 space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? "Редактирование статьи" : "Новая статья"}</h2>
          <TextField
            id="slug"
            label="Адрес страницы"
            hint="Латиница, цифры и дефис. Например: kak-avtomatizirovat-zayavki"
            required
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
          />
          <TextField
            id="title"
            label="Заголовок"
            required
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <TextAreaField
            id="excerpt"
            label="Анонс"
            hint="Короткое описание для списка и поисковой выдачи, до 320 символов"
            rows={3}
            value={draft.excerpt}
            onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
          />
          <TextAreaField
            id="body_md"
            label="Текст статьи"
            hint="Markdown: ## заголовок, **жирный**, - список"
            rows={12}
            value={draft.body_md}
            onChange={(e) => setDraft({ ...draft, body_md: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="status"
              label="Статус"
              value={draft.status}
              options={[
                { value: "draft", label: "Черновик" },
                { value: "published", label: "Опубликована" },
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

      {state === "loading" ? <p className="text-sm text-[color:var(--c-text-muted)]">Загружаю…</p> : null}
      {state === "error" ? (
        <div className="space-y-2">
          <p className="text-sm text-[#E5544B]">Не удалось загрузить список</p>
          <Button variant="secondary" onClick={() => void load()}>Повторить</Button>
        </div>
      ) : null}
      {state === "ready" && items.length === 0 ? (
        <p className="text-sm text-[color:var(--c-text-muted)]">
          Статей пока нет. Нажмите «Новая статья», чтобы написать первую.
        </p>
      ) : null}

      {state === "ready" && items.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--c-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--c-surface-2)] text-left text-[color:var(--c-text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Заголовок</th>
                <th className="px-4 py-3 font-medium">Адрес</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-[color:var(--c-border)]">
                  <td className="px-4 py-3">{a.title}</td>
                  <td className="px-4 py-3 text-[color:var(--c-text-muted)]">/blog/{a.slug}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.status === "published" ? "tech" : "muted"}>
                      {a.status === "published" ? "Опубликована" : "Черновик"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={() => startEdit(a)}>Изменить</Button>
                      <Button variant="ghost" onClick={() => void togglePublished(a)}>
                        {a.status === "published" ? "Снять" : "Опубликовать"}
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
