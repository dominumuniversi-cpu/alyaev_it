/** Кабинет клиента: профиль, проекты, карточка проекта (ТЗ 9.1).
 *
 * Все данные приходят по cookie сессии — значит, только на клиенте:
 * серверный рендер увидел бы пустой кабинет. Изоляция проектов при этом
 * на сервере (app/api/account.py), здесь только отображение.
 */

"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

type AccountNotification = {
  id: number;
  kind: string;
  title: string;
  body: string;
  project_id: number | null;
  read: boolean;
  created_at: string | null;
};

type Project = {
  id: number;
  title: string;
  status: string;
  status_label: string;
  price_rub: number | null;
  due_at: string | null;
  created_at: string | null;
};

type Task = {
  id: number;
  title: string;
  description: string;
  status_label: string;
  due_at: string | null;
};

type HistoryRow = {
  status_to_label: string;
  comment: string;
  created_at: string | null;
};

type ProjectDetail = Project & {
  description: string;
  started_at: string | null;
  completed_at: string | null;
  tasks: Task[];
  history: HistoryRow[];
};

type Profile = { display_name: string; company: string; email: string };

/** Цена в рублях или «по договорённости», если ещё не согласована. */
type ProjectDocument = {
  id: number;
  title: string;
  category: string;
  file_name: string;
  size_bytes: number;
  created_at: string | null;
  download_url: string;
};

type ProjectMessage = {
  id: number;
  author_role: string;
  body: string;
  created_at: string | null;
};

/** Категории документов: те же коды, что в CHECK базы. */
const DOC_CATEGORY_LABELS: Record<string, string> = {
  tz: "ТЗ",
  act: "Акт",
  instruction: "Инструкция",
  other: "Документ",
};

/** Размер файла по-человечески: 1024 байта неудобно читать. */
function fileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " Б";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " КБ";
  return (bytes / (1024 * 1024)).toFixed(1) + " МБ";
}
function money(value: number | null): string {
  if (value === null) return "по договорённости";
  return value.toLocaleString("ru-RU") + " ₽";
}

/** Дата в виде 24.11.2026; пустое значение не ломает вёрстку. */
function date(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU");
}

/** Цвет статуса: золото — работа идёт, голубой — впереди, серый — закрыто. */
function statusClass(status: string): string {
  if (status === "done") return "border-[color:var(--c-border)] text-[color:var(--c-text-muted)]";
  if (status === "new") return "border-[color:var(--c-terracotta)]/40 text-[color:var(--c-terracotta)]";
  return "border-[color:var(--c-lime)]/40 text-[color:var(--c-lime)]";
}

/** Кабинет: список проектов или карточка одного проекта. */
export function AccountShell({ mode, projectId }: { mode: "list" | "detail"; projectId?: number }) {
  const [state, setState] = useState<"loading" | "unauth" | "nocabinet" | "ok">("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);

  /** Загружает данные кабинета; на 401 отправляет на вход. */
  const load = useCallback(async () => {
    const url = mode === "detail"
      ? BASE_PATH + "/api/v1/account/projects/" + projectId
      : BASE_PATH + "/api/v1/account/projects";
    try {
      const res = await fetch(url, { credentials: "include", cache: "no-store" });
      if (res.status === 401) { setState("unauth"); return; }
      if (res.status === 404) {
        // 404 бывает двух видов: нет карточки клиента или чужой/несуществующий проект.
        // Различаем по тексту — сервер его не скрывает только в первом случае.
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        setState(body.detail && body.detail.includes("не заведён") ? "nocabinet" : "unauth");
        return;
      }
      if (!res.ok) { setState("unauth"); return; }
      const data = await res.json();
      if (mode === "detail") setDetail(data as ProjectDetail);
      else setProjects((data as { items: Project[] }).items);
      setState("ok");
    } catch {
      setState("unauth");
    }
  }, [mode, projectId]);

  /** Профиль грузится отдельно: отказ в нём не должен закрывать проекты. */
  useEffect(() => {
    void load();
    (async () => {
      try {
        const res = await fetch(BASE_PATH + "/api/v1/account/profile", { credentials: "include" });
        if (res.ok) setProfile((await res.json()) as Profile);
      } catch {
        // Профиль необязателен — молча оставляем пустым.
      }
    })();
  }, [load]);

  // Заголовок присутствует во всех состояниях: страница без h1 — нарушение ТЗ 11.5,
  // а «Загружаем…» без h1 означает, что при медленной сети h1 не будет вообще.
  const heading = mode === "detail" ? "Проект" : "Личный кабинет";
  if (state === "loading") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="text-[color:var(--c-text-muted)]">Загружаем…</p>
      </div>
    );
  }

  if (state === "unauth") {
    return (
      <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-8">
        <h1 className="mb-2 text-xl font-semibold">Нужен вход</h1>
        <p className="mb-5 text-sm text-[color:var(--c-text-muted)]">
          Кабинет доступен после входа. Учётную запись выдаёт исполнитель после заказа.
        </p>
        <a
          href={BASE_PATH + "/account/login"}
          className="inline-block rounded-lg bg-[color:var(--c-lime)] px-5 py-3 font-medium text-[color:var(--c-ink)]"
        >
          Войти
        </a>
      </div>
    );
  }

  if (state === "nocabinet") {
    return (
      <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-8">
        <h1 className="mb-2 text-xl font-semibold">Кабинет ещё не заведён</h1>
        <p className="text-sm text-[color:var(--c-text-muted)]">
          Учётная запись есть, но карточки клиента пока нет. Напишите исполнителю — он откроет доступ.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Личный кабинет</h1>
          {profile ? (
            <p className="mt-1 text-sm text-[color:var(--c-text-muted)]">
              {profile.display_name}
              {profile.company ? " · " + profile.company : ""}
            </p>
          ) : null}
        </div>
        <div className="flex gap-3">
          {mode === "detail" ? (
            <a href={BASE_PATH + "/account"} className="text-sm text-[color:var(--c-terracotta)] hover:underline">
              ← Все проекты
            </a>
          ) : null}
          <LogoutButton />
        </div>
      </header>

      {mode === "list" ? (
        <>
          <NotificationsBlock />
          <ProjectList projects={projects} />
        </>
      ) : null}
      {mode === "detail" && detail ? <ProjectCard project={detail} /> : null}
    </div>
  );
}

/** Список проектов или честная пустота вместо заглушки. */
/** Уведомления кабинета: что случилось, пока клиент не заходил. */
function NotificationsBlock() {
  const [items, setItems] = useState<AccountNotification[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(BASE_PATH + "/api/v1/account/notifications", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
      .then((data) => {
        if (!alive) return;
        setItems(data.items ?? []);
        setUnread(data.unread ?? 0);
      })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  /** Отметка без перезагрузки: счётчик уменьшается сразу. */
  async function markRead(id: number) {
    try {
      const res = await fetch(BASE_PATH + "/api/v1/account/notifications/" + id + "/read", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return;
      setItems((prev) =>
        (prev ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {
      setFailed(true);
    }
  }

  if (failed) return null;
  if (items === null) return null;

  return (
    <section className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
      <h2 className="mb-1 text-lg font-semibold">Уведомления</h2>
      <p className="mb-4 text-sm text-[color:var(--c-text-muted)]">
        {unread > 0 ? "Непрочитанных: " + unread : "Всё прочитано"}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-[color:var(--c-text-muted)]">Уведомлений пока нет.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={
                "border-b border-[color:var(--c-border)] pb-3 last:border-0 last:pb-0" +
                (n.read ? "" : " opacity-100")
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className={"text-sm" + (n.read ? " text-[color:var(--c-text-muted)]" : "")}>
                    {n.read ? "" : "● "}
                    {n.title}
                  </p>
                  {n.body ? (
                    <p className="mt-1 whitespace-pre-line text-xs text-[color:var(--c-text-muted)]">{n.body}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[color:var(--c-text-muted)]">{date(n.created_at)}</p>
                </div>
                {n.read ? null : (
                  <button
                    type="button"
                    onClick={() => void markRead(n.id)}
                    className="text-xs text-[color:var(--c-terracotta)] hover:underline"
                  >
                    Отметить прочитанным
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
function ProjectList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-8 text-center">
        <p className="text-[color:var(--c-text-muted)]">
          Проектов пока нет. Как только работа начнётся, она появится здесь.
        </p>
      </div>
    );
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {projects.map((p) => (
        <li key={p.id}>
          <a
            href={BASE_PATH + "/account/projects/" + p.id}
            className="block h-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6 transition-colors hover:border-[color:var(--c-lime)]/50"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{p.title}</h2>
              <span className={"shrink-0 rounded-full border px-3 py-1 text-xs " + statusClass(p.status)}>
                {p.status_label}
              </span>
            </div>
            <dl className="space-y-1 text-sm text-[color:var(--c-text-muted)]">
              <div className="flex justify-between">
                <dt>Стоимость</dt>
                <dd className="text-[color:var(--c-text)]">{money(p.price_rub)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Срок</dt>
                <dd className="text-[color:var(--c-text)]">{date(p.due_at)}</dd>
              </div>
            </dl>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Карточка проекта: описание, задачи и история статусов. */
function ProjectCard({ project }: { project: ProjectDetail }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">{project.title}</h2>
          <span className={"rounded-full border px-3 py-1 text-xs " + statusClass(project.status)}>
            {project.status_label}
          </span>
        </div>
        {project.description ? (
          <p className="mb-4 whitespace-pre-line text-sm text-[color:var(--c-text-muted)]">
            {project.description}
          </p>
        ) : null}
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[color:var(--c-text-muted)]">Стоимость</dt>
            <dd className="mt-1">{money(project.price_rub)}</dd>
          </div>
          <div>
            <dt className="text-[color:var(--c-text-muted)]">Начат</dt>
            <dd className="mt-1">{date(project.started_at)}</dd>
          </div>
          <div>
            <dt className="text-[color:var(--c-text-muted)]">Срок</dt>
            <dd className="mt-1">{date(project.due_at)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold">Задачи</h3>
        {project.tasks.length === 0 ? (
          <p className="text-sm text-[color:var(--c-text-muted)]">Задач пока нет.</p>
        ) : (
          <ul className="space-y-3">
            {project.tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-[color:var(--c-border)] pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm">
                    {t.status_label === "Готово" ? "✓ " : "• "}
                    {t.title}
                  </p>
                  {t.description ? (
                    <p className="mt-1 text-xs text-[color:var(--c-text-muted)]">{t.description}</p>
                  ) : null}
                </div>
                <span className="text-xs text-[color:var(--c-text-muted)]">{t.status_label}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold">История</h3>
        {project.history.length === 0 ? (
          <p className="text-sm text-[color:var(--c-text-muted)]">Изменений пока не было.</p>
        ) : (
          <ol className="space-y-3">
            {project.history.map((h, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-24 shrink-0 text-[color:var(--c-text-muted)]">{date(h.created_at)}</span>
                <span>
                  {h.status_to_label}
                  {h.comment ? " — " + h.comment : ""}
                </span>
              </li>
            ))}
          </ol>
        )}      </section>

      <DocumentsBlock projectId={project.id} />

      <MessagesBlock projectId={project.id} />
    </div>
  );
}

/** Документы проекта: список, скачивание и загрузка клиентом. */
function DocumentsBlock({ projectId }: { projectId: number }) {
  const [items, setItems] = useState<ProjectDocument[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /** Догружает список: после загрузки файла, без перезагрузки страницы. */
  const reload = useCallback(() => {
    return fetch(BASE_PATH + "/api/v1/account/projects/" + projectId + "/documents", {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
      .then((data) => setItems(data.items ?? []));
  }, [projectId]);

  /** Отправляет файл на сервер и обновляет список. */
  const upload = async (form: HTMLFormElement) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(BASE_PATH + "/api/v1/account/projects/" + projectId + "/documents", {
        method: "POST",
        credentials: "include",
        body: new FormData(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.detail === "string" ? data.detail : "Не удалось загрузить файл.");
        return;
      }
      form.reset();
      await reload();
    } catch {
      setError("Не удалось загрузить файл. Проверьте связь.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let alive = true;
    reload()
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [reload]);

  return (
    <section className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
      <h3 className="mb-4 text-lg font-semibold">Документы</h3>
      {failed ? (
        <p className="text-sm text-[color:var(--c-text-muted)]">Не удалось загрузить документы.</p>
      ) : items === null ? (
        <p className="text-sm text-[color:var(--c-text-muted)]">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[color:var(--c-text-muted)]">Документов пока нет.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--c-border)] pb-3 last:border-0 last:pb-0">
              <a href={BASE_PATH + d.download_url} className="text-sm underline">
                {d.title}
              </a>
              <span className="text-xs text-[color:var(--c-text-muted)]">
                {DOC_CATEGORY_LABELS[d.category] ?? d.category} · {d.file_name} · {fileSize(d.size_bytes)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-5 space-y-3 border-t border-[color:var(--c-border)] pt-5"
        onSubmit={(e) => {
          e.preventDefault();
          void upload(e.currentTarget);
        }}
      >
        <p className="text-sm font-medium">Прикрепить документ</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <input
            type="file"
            name="file"
            required
            accept=".pdf,.docx,.xlsx,.zip"
            className="text-sm text-[color:var(--c-text-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[color:var(--c-border)] file:px-3 file:py-2 file:text-sm file:text-[color:var(--c-text)]"
          />
          <select
            name="category"
            defaultValue="other"
            className="rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] px-3 py-2 text-sm text-[color:var(--c-text)]"
          >
            <option value="tz">ТЗ</option>
            <option value="act">Акт</option>
            <option value="instruction">Инструкция</option>
            <option value="other">Другое</option>
          </select>
          <Button type="submit" disabled={busy}>
            {busy ? "Загрузка…" : "Загрузить"}
          </Button>
        </div>
        <p className="text-xs text-[color:var(--c-text-muted)]">
          PDF, DOCX, XLSX, ZIP до 20 МБ.
        </p>
        {error ? (
          <p className="text-sm text-[color:var(--c-danger)]">{error}</p>
        ) : null}
      </form>
    </section>
  );
}

/** Переписка по проекту: свои сообщения справа, ответы студии слева. */
function MessagesBlock({ projectId }: { projectId: number }) {
  const [items, setItems] = useState<ProjectMessage[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(BASE_PATH + "/api/v1/account/projects/" + projectId + "/messages", {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
      .then((data) => { if (alive) setItems(data.items ?? []); })
      .catch(() => { if (alive) setFailed("Не удалось загрузить переписку."); });
    return () => { alive = false; };
  }, [projectId]);

  /** Отправка без перезагрузки: сообщение появляется сразу. */
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setFailed(null);
    try {
      const res = await fetch(
        BASE_PATH + "/api/v1/account/projects/" + projectId + "/messages?body=" + encodeURIComponent(body),
        { method: "POST", credentials: "include" },
      );
      if (!res.ok) { setFailed("Не удалось отправить сообщение."); return; }
      const data = await res.json();
      setItems((prev) => [
        ...(prev ?? []),
        { id: data.id, author_role: "client", body, created_at: data.created_at },
      ]);
      setText("");
    } catch {
      setFailed("Сеть недоступна.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
      <h3 className="mb-4 text-lg font-semibold">Переписка</h3>
      {items === null ? (
        <p className="text-sm text-[color:var(--c-text-muted)]">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[color:var(--c-text-muted)]">Сообщений пока нет.</p>
      ) : (
        <ul className="mb-4 space-y-3">
          {items.map((m) => (
            <li
              key={m.id}
              className={m.author_role === "client" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  "max-w-[80%] rounded-xl px-3 py-2 text-sm " +
                  (m.author_role === "client"
                    ? "bg-[color:var(--c-bg)] border border-[color:var(--c-gold)]"
                    : "bg-[color:var(--c-bg)] border border-[color:var(--c-border)]")
                }
              >
                <p className="whitespace-pre-line">{m.body}</p>
                <p className="mt-1 text-xs text-[color:var(--c-text-muted)]">
                  {m.author_role === "client" ? "Вы" : "Студия"} · {date(m.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={send} className="flex flex-wrap items-end gap-3">
        <label htmlFor="msg-body" className="sr-only">Сообщение</label>
        <textarea
          id="msg-body"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={5000}
          placeholder="Написать сообщение…"
          className="min-w-[240px] flex-1 rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-bg)] p-3 text-sm"
        />
        <Button type="submit" disabled={busy || !text.trim()}>
          {busy ? "Отправка…" : "Отправить"}
        </Button>
      </form>
      {failed ? <p className="mt-2 text-sm text-[color:var(--c-danger)]">{failed}</p> : null}
    </section>
  );
}
function LogoutButton() {
  const [busy, setBusy] = useState(false);

  /** Завершает сессию на сервере, затем уводит на страницу входа. */
  async function onClick() {
    setBusy(true);
    try {
      await fetch(BASE_PATH + "/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Даже при сбое сети уводим на вход: показать кабинет после «выхода» хуже.
    }
    window.location.assign(BASE_PATH + "/account/login");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="text-sm text-[color:var(--c-text-muted)] hover:text-[color:var(--c-text)] disabled:opacity-50"
    >
      {busy ? "Выходим…" : "Выйти"}
    </button>
  );
}
