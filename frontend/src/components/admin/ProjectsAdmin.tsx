/** Проекты клиентов в админке: создание, статусы, задачи (ТЗ 9.2).
 *
 * Манифест: docs/manifests/ui/admin-projects.md.
 * Правило проекта: действия через fetch, страница не перезагружается.
 */

"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

type Client = { id: number; display_name: string };

type Task = {
  id: number;
  title: string;
  status: string;
  completed_at: string | null;
};

type Project = {
  id: number;
  client_id: number;
  client_name: string;
  title: string;
  status: string;
  price_rub: number | null;
  created_at: string | null;
};

/** Подписи статусов — те же слова, что видит клиент в кабинете. */
const STATUS_OPTIONS = [
  { value: "new", label: "Новый" },
  { value: "analysis", label: "Анализ" },
  { value: "dev", label: "Разработка" },
  { value: "testing", label: "Тестирование" },
  { value: "done", label: "Завершён" },
];

/** Подписи статусов задачи: коротко, по делу. */
const TASK_STATUS_OPTIONS = [
  { value: "todo", label: "К выполнению" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Готово" },
];

/** Название статуса по коду; неизвестный код показываем как есть, не теряем. */
function statusLabel(code: string): string {
  return STATUS_OPTIONS.find((o) => o.value === code)?.label ?? code;
}

/** Цена в рублях; пустая цена — «по договорённости», а не ноль. */
function money(value: number | null): string {
  if (value === null || value === undefined) return "по договорённости";
  return value.toLocaleString("ru-RU") + " ₽";
}

/** Экран проектов: список, форма создания, смена статуса. */
export function ProjectsAdmin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [taskFor, setTaskFor] = useState<number | null>(null);
  // Задачи грузятся лениво: они нужны не для каждого проекта сразу.
  const [tasks, setTasks] = useState<Record<number, Task[]>>({});

  /** Загружает проекты и клиентов: клиенты нужны для выбора в форме. */
  const load = useCallback(async () => {
    setState("loading");
    try {
      const [pr, cl] = await Promise.all([
        fetch(BASE_PATH + "/api/v1/admin/projects", { credentials: "include", cache: "no-store" }),
        fetch(BASE_PATH + "/api/v1/admin/clients", { credentials: "include", cache: "no-store" }),
      ]);
      if ([pr, cl].some((r) => r.status === 401 || r.status === 403)) {
        window.location.assign(BASE_PATH + "/login/");
        return;
      }
      if (!pr.ok || !cl.ok) { setState("error"); return; }
      const pd = await pr.json();
      const cd = await cl.json();
      setProjects(pd.items ?? []);
      setClients(cd.items ?? []);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  /** Создаёт проект и перерисовывает список без перезагрузки. */
  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const priceRaw = String(fd.get("price_rub") ?? "").trim();
    setNotice(null);
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          client_id: Number(fd.get("client_id")),
          title: String(fd.get("title") ?? ""),
          description: String(fd.get("description") ?? ""),
          // Пустая цена — null, а не 0: ноль это конкретная цена, а не «не задана».
          price_rub: priceRaw === "" ? null : Number(priceRaw),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) { setNotice(data.detail ?? "Не удалось создать проект."); return; }
      form.reset();
      setNotice("Проект создан.");
      await load();
    } catch {
      setNotice("Сеть недоступна.");
    }
  }

  /** Меняет статус проекта сразу, без промежуточной формы. */
  async function onStatus(project: Project, value: string) {
    setBusy(project.id);
    setNotice(null);
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/projects/" + project.id + "/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: value }),
      });
      const data = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) { setNotice(data.detail ?? "Не удалось сменить статус."); return; }
      setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, status: value } : p)));
    } catch {
      setNotice("Сеть недоступна.");
    } finally {
      setBusy(null);
    }
  }

  /** Добавляет задачу в проект. */
  async function onTask(event: React.FormEvent<HTMLFormElement>, projectId: number) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = String(new FormData(form).get("title") ?? "").trim();
    if (!title) return;
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/projects/" + projectId + "/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title }),
      });
      if (!res.ok) { setNotice("Не удалось добавить задачу."); return; }
      form.reset();
      setNotice("Задача добавлена.");
      // Перечитываем задачи: новая должна появиться сразу, без перезагрузки.
      await loadTasks(projectId);
    } catch {
      setNotice("Сеть недоступна.");
    }
  }

  /** Загружает задачи проекта; повторный вызов не дублирует запрос. */
  async function loadTasks(projectId: number) {
    try {
      const res = await fetch(BASE_PATH + "/api/v1/admin/projects/" + projectId + "/tasks", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setTasks((prev) => ({ ...prev, [projectId]: data.items ?? [] }));
    } catch {
      setNotice("Не удалось загрузить задачи.");
    }
  }

  /** Открывает блок задач проекта и подгружает их. */
  async function toggleTasks(projectId: number) {
    if (taskFor === projectId) { setTaskFor(null); return; }
    setTaskFor(projectId);
    await loadTasks(projectId);
  }

  /** Меняет статус задачи; чекбокс «готово» — самый частый случай. */
  async function onTaskStatus(projectId: number, task: Task, value: string) {
    try {
      const res = await fetch(
        BASE_PATH + "/api/v1/admin/projects/" + projectId + "/tasks/" + task.id,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: value }),
        },
      );
      if (!res.ok) { setNotice("Не удалось сменить статус задачи."); return; }
      // Обновляем только свою строку: список не дёргается.
      setTasks((prev) => ({
        ...prev,
        [projectId]: (prev[projectId] ?? []).map((x) =>
          x.id === task.id ? { ...x, status: value, completed_at: value === "done" ? new Date().toISOString() : null } : x,
        ),
      }));
    } catch {
      setNotice("Сеть недоступна.");
    }
  }
  if (state === "loading") return <p className="text-[color:var(--c-text-muted)]">Загружаем…</p>;
  if (state === "error") return <p role="alert" className="text-[#E5544B]">Не удалось загрузить проекты.</p>;

  const clientOptions = clients.map((c) => ({ value: String(c.id), label: c.display_name }));

  return (
    <div className="space-y-8">
      {notice ? (
        <p role="status" className="rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] px-4 py-3 text-sm">
          {notice}
        </p>
      ) : null}

      <form onSubmit={onCreate} className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
        <h2 className="mb-4 text-lg font-semibold">Новый проект</h2>
        {clients.length === 0 ? (
          <p className="text-sm text-[color:var(--c-text-muted)]">
            Сначала создайте клиента в разделе «Клиенты». Проект без клиента не заводится.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField id="client_id" name="client_id" label="Клиент" options={clientOptions} required />
              <TextField id="title" name="title" label="Название проекта" required />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField id="price_rub" name="price_rub" label="Стоимость, ₽ (необязательно)" type="number" min="0" />
            </div>
            <div className="mt-4">
              <TextAreaField id="description" name="description" label="Описание (необязательно)" rows={3} />
            </div>
            <div className="mt-4">
              <Button type="submit">Создать проект</Button>
            </div>
          </>
        )}
      </form>

      {projects.length === 0 ? (
        <p className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-8 text-center text-[color:var(--c-text-muted)]">
          Проектов пока нет.
        </p>
      ) : (
        <ul className="space-y-4">
          {projects.map((p) => (
            <li key={p.id} className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">{p.title}</h3>
                  <p className="text-sm text-[color:var(--c-text-muted)]">
                    {p.client_name} · {money(p.price_rub)}
                  </p>
                </div>
                <Badge variant="tech">{statusLabel(p.status)}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="w-52">
                  <label htmlFor={"status-" + p.id} className="mb-1.5 block text-sm font-medium">
                    Статус
                  </label>
                  <select
                    id={"status-" + p.id}
                    value={p.status}
                    disabled={busy === p.id}
                    onChange={(e) => void onStatus(p, e.target.value)}
                    className="w-full rounded-[10px] border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] px-3 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <Button type="button" variant="secondary" onClick={() => void toggleTasks(p.id)}>
                  {taskFor === p.id ? "Скрыть задачи" : "Задачи"}
                </Button>
              </div>
              {taskFor === p.id ? (
                <div className="mt-4 space-y-3 border-t border-[color:var(--c-border)] pt-4">
                  {(tasks[p.id] ?? []).length === 0 ? (
                    <p className="text-sm text-[color:var(--c-text-muted)]">Задач пока нет.</p>
                  ) : (
                    <ul className="space-y-2">
                      {(tasks[p.id] ?? []).map((task) => (
                        <li key={task.id} className="flex items-center gap-3">
                          <input
                            id={"task-done-" + task.id}
                            type="checkbox"
                            checked={task.status === "done"}
                            onChange={(e) => void onTaskStatus(p.id, task, e.target.checked ? "done" : "todo")}
                            className="h-4 w-4 rounded border-[color:var(--c-border)]"
                          />
                          <label
                            htmlFor={"task-done-" + task.id}
                            className={
                              "cursor-pointer text-sm " +
                              (task.status === "done"
                                ? "text-[color:var(--c-text-muted)] line-through"
                                : "text-[color:var(--c-text)]")
                            }
                          >
                            {task.title}
                          </label>
                          {task.status === "in_progress" ? <Badge variant="tech">в работе</Badge> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                  <form onSubmit={(e) => void onTask(e, p.id)} className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[240px] flex-1">
                      <TextField id={"task-" + p.id} name="title" label="Новая задача" required />
                    </div>
                    <Button type="submit">Добавить</Button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
