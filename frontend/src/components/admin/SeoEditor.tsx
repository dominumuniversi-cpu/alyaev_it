/** SEO-панель страницы: поля, предпросмотр сниппета, проверки. */
/** Манифест: docs/manifests/ui/seo-panel.md */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

/** Рекомендуемые пределы длины — те же, что проверяет сервер. */
const TITLE_MIN = 30, TITLE_MAX = 60;
const DESC_MIN = 70, DESC_MAX = 160;

type Page = { path: string; title: string; description: string; robots_index: boolean };

type Values = {
  title: string;
  description: string;
  h1: string;
  keywords: string;
  canonical: string;
  robots_index: boolean;
  robots_follow: boolean;
  og_title: string;
  og_description: string;
  og_image: string;
};

const EMPTY: Values = {
  title: "", description: "", h1: "", keywords: "", canonical: "",
  robots_index: true, robots_follow: true, og_title: "", og_description: "", og_image: "",
};

/**
 * Адрес API для страницы. Замыкающий слеш в адресе запроса даёт 308-редирект,
 * поэтому берём путь в том виде, в каком его хранит сервер, и срезаем слеш.
 */
function apiUrl(pagePath: string): string {
  const clean = pagePath.replace(/\/+$/, "");
  return BASE_PATH + "/api/v1/admin/seo" + clean;
}

/** Подсвечивает счётчик, если длина вне рекомендуемого диапазона. */
function lengthClass(len: number, min: number, max: number): string {
  if (len === 0) return "text-[color:var(--c-muted)]";
  if (len < min || len > max) return "text-[color:var(--c-warning)]";
  return "text-[color:var(--c-terra-ink)]";
}

/** Редактор SEO одной страницы. */
export function SeoEditor() {
  const [pages, setPages] = useState<Page[]>([]);
  const [path, setPath] = useState<string>("/");
  const [values, setValues] = useState<Values>(EMPTY);
  const [exists, setExists] = useState(false);
  const [forced, setForced] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Загружает список страниц, у которых уже есть SEO. */
  const loadPages = useCallback(async () => {
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/seo", { credentials: "include", cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        window.location.assign(BASE_PATH + "/login/");
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setPages(data.items ?? []);
    } catch { /* список не критичен: страницу можно ввести руками */ }
  }, []);

  /** Загружает значения SEO для выбранной страницы. */
  const loadPage = useCallback(async (p: string) => {
    setState("loading");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(apiUrl(p), { credentials: "include", cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        window.location.assign(BASE_PATH + "/login/");
        return;
      }
      if (!res.ok) { setState("error"); return; }
      const data = await res.json();
      setExists(Boolean(data.exists));
      setForced(Boolean(data.forced_noindex));
      setWarnings(data.warnings ?? []);
      setValues({
        title: data.title ?? "",
        description: data.description ?? "",
        h1: data.h1 ?? "",
        keywords: data.keywords ?? "",
        canonical: data.canonical ?? "",
        robots_index: data.robots_index ?? true,
        robots_follow: data.robots_follow ?? true,
        og_title: data.og_title ?? "",
        og_description: data.og_description ?? "",
        og_image: data.og_image ?? "",
      });
      setState("ready");
    } catch { setState("error"); }
  }, []);

  useEffect(() => { void loadPages(); }, [loadPages]);
  useEffect(() => { void loadPage(path); }, [loadPage, path]);

  /** Сохраняет SEO-поля страницы. */
  async function save() {
    if (!values.title.trim()) { setError("Title обязателен"); return; }
    if (!values.description.trim()) { setError("Description обязателен"); return; }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(apiUrl(path), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          path,
          title: values.title.trim(),
          description: values.description.trim(),
          h1: values.h1,
          keywords: values.keywords,
          canonical: values.canonical || null,
          robots_index: values.robots_index,
          robots_follow: values.robots_follow,
          og_title: values.og_title,
          og_description: values.og_description,
          og_image: values.og_image,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.detail === "string" ? body.detail : "Не удалось сохранить");
        return;
      }
      const data = await res.json();
      setWarnings(data.warnings ?? []);
      setExists(true);
      setNotice("Сохранено");
      await loadPages();
    } catch { setError("Сеть недоступна"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-5 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="page-path" className="mb-1.5 block text-sm font-medium">Страница</label>
            <select
              id="page-path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="w-full rounded-[10px] border border-[color:var(--c-line)] bg-[color:var(--c-paper)] px-3.5 py-2.5 text-sm"
            >
              {["/", "/services/", "/portfolio/", "/blog/", "/about/", "/contacts/", "/calculator/", "/diagnostics/", "/reviews/"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
              {pages.filter((p) => !["/", "/services/", "/portfolio/", "/blog/", "/about/", "/contacts/", "/calculator/", "/diagnostics/", "/reviews/"].includes(p.path)).map((p) => (
                <option key={p.path} value={p.path}>{p.path}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {exists ? <Badge variant="tech">Свои SEO-поля</Badge> : <Badge variant="muted">Автоматические</Badge>}
            {forced ? <Badge variant="muted">Закрыт от индексации</Badge> : null}
          </div>
        </div>
      </section>

      {state === "loading" ? <p className="text-sm text-[color:var(--c-muted)]">Загружаю…</p> : null}
      {state === "error" ? (
        <div className="space-y-2">
          <p className="text-sm text-[color:var(--c-danger)]">Не удалось загрузить SEO этой страницы</p>
          <Button variant="secondary" onClick={() => void loadPage(path)}>Повторить</Button>
        </div>
      ) : null}

      {state === "ready" ? (
        <>
          <section className="rounded-2xl border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-5 space-y-4">
            <TextField
              id="seo-title"
              label="SEO Title"
              required
              hint={"Рекомендуется " + TITLE_MIN + "–" + TITLE_MAX + " символов"}
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
            />
            <p className={"-mt-2 text-xs " + lengthClass(values.title.length, TITLE_MIN, TITLE_MAX)}>
              {values.title.length} символов
            </p>
            <TextAreaField
              id="seo-desc"
              label="Meta Description"
              required
              hint={"Рекомендуется " + DESC_MIN + "–" + DESC_MAX + " символов"}
              rows={3}
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
            <p className={"-mt-2 text-xs " + lengthClass(values.description.length, DESC_MIN, DESC_MAX)}>
              {values.description.length} символов
            </p>
            <TextField
              id="seo-h1"
              label="H1"
              hint="Основной заголовок страницы"
              value={values.h1}
              onChange={(e) => setValues({ ...values, h1: e.target.value })}
            />
            <TextField
              id="seo-keywords"
              label="Keywords"
              hint="Для внутренней работы с семантикой. Google не использует это поле для ранжирования"
              value={values.keywords}
              onChange={(e) => setValues({ ...values, keywords: e.target.value })}
            />
            <TextField
              id="seo-canonical"
              label="Canonical URL"
              hint="Пусто — используется текущий адрес страницы"
              value={values.canonical}
              onChange={(e) => setValues({ ...values, canonical: e.target.value })}
            />
          </section>

          <section className="rounded-2xl border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-5 space-y-3">
            <h2 className="text-lg font-semibold">Индексация</h2>
            {forced ? (
              <p className="text-sm text-[color:var(--c-muted)]">
                Этот раздел закрыт от индексации по правилу сайта. Переключатели не действуют.
              </p>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.robots_index}
                disabled={forced}
                onChange={(e) => setValues({ ...values, robots_index: e.target.checked })}
                className="h-4 w-4"
              />
              Разрешить индексацию (robots index)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.robots_follow}
                disabled={forced}
                onChange={(e) => setValues({ ...values, robots_follow: e.target.checked })}
                className="h-4 w-4"
              />
              Переходить по ссылкам (robots follow)
            </label>
          </section>

          <section className="rounded-2xl border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-5 space-y-3">
            <h2 className="text-lg font-semibold">Превью в поиске</h2>
            <div className="rounded-xl on-dark:bg-[color:var(--c-ink-2)] bg-[color:var(--c-paper-2)] p-4">
              <p className="text-[13px] text-[color:var(--c-terra-ink)]">{values.title || "Заголовок страницы"}</p>
              <p className="text-[12px] text-[color:var(--c-success)]">alyaev.ru{path}</p>
              <p className="mt-1 text-[13px] text-[color:var(--c-muted)]">
                {values.description || "Описание страницы появится здесь."}
              </p>
            </div>
          </section>

          {warnings.length > 0 ? (
            <section className="rounded-2xl border border-[color:var(--c-warning)]/40 bg-[color:var(--c-warning)]/5 p-4">
              <h2 className="mb-2 text-sm font-semibold text-[color:var(--c-warning)]">Предупреждения</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--c-muted)]">
                {warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </section>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void save()} disabled={busy}>{busy ? "Сохраняю…" : "Сохранить"}</Button>
            <Button variant="secondary" onClick={() => void loadPage(path)} disabled={busy}>Сбросить изменения</Button>
            {notice ? <span className="text-sm text-[color:var(--c-terra-ink)]">{notice}</span> : null}
            {error ? <span role="alert" className="text-sm text-[color:var(--c-danger)]">{error}</span> : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
