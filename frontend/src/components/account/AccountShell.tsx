/** Кабинет клиента: профиль, проекты, карточка проекта (ТЗ 9.1).
 *
 * Все данные приходят по cookie сессии — значит, только на клиенте:
 * серверный рендер увидел бы пустой кабинет. Изоляция проектов при этом
 * на сервере (app/api/account.py), здесь только отображение.
 */

"use client";

import { useCallback, useEffect, useState } from "react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

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
  if (status === "new") return "border-[#22B8E6]/40 text-[#22B8E6]";
  return "border-[#E3BC7A]/40 text-[#E3BC7A]";
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
          className="inline-block rounded-lg bg-[#E3BC7A] px-5 py-3 font-medium text-[#05070D]"
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
            <a href={BASE_PATH + "/account"} className="text-sm text-[#22B8E6] hover:underline">
              ← Все проекты
            </a>
          ) : null}
          <LogoutButton />
        </div>
      </header>

      {mode === "list" ? <ProjectList projects={projects} /> : null}
      {mode === "detail" && detail ? <ProjectCard project={detail} /> : null}
    </div>
  );
}

/** Список проектов или честная пустота вместо заглушки. */
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
            className="block h-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6 transition-colors hover:border-[#E3BC7A]/50"
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
        )}
      </section>
    </div>
  );
}

/** Выход: гасит текущую сессию и возвращает на вход. */
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
