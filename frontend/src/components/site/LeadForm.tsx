/** Форма заявки: fetch без перезагрузки. Манифест: docs/manifests/ui/field.md */

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";

const CONSENT_VERSION = "1.0";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

type Errors = Partial<Record<"name" | "contact" | "message" | "consent", string>>;

/** Проверяет поля: те же правила, что в манифесте и на сервере. */
function validate(data: { name: string; contact: string; message: string; consent: boolean }): Errors {
  const errors: Errors = {};
  if (data.name.trim().length < 2) errors.name = "Укажите имя (минимум 2 символа)";
  if (data.contact.trim().length < 3) errors.contact = "Укажите Telegram, телефон или e-mail";
  if (data.message.trim().length < 20) errors.message = "Опишите задачу подробнее — минимум 20 символов";
  if (!data.consent) errors.consent = "Нужно согласие на обработку данных";
  return errors;
}

/** Форма заявки: отправка через fetch, без перезагрузки страницы. */
export function LeadForm({ taskOptions }: { taskOptions: { value: string; label: string }[] }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  /** Отправляет заявку и показывает результат на месте. */
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: String(formData.get("name") ?? ""),
      contact: String(formData.get("contact") ?? ""),
      message: String(formData.get("message") ?? ""),
      consent: formData.get("consent") === "on",
    };

    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setState("sending");
    setServerError(null);

    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const value = params.get(key);
      if (value) utm[key] = value;
    }

    try {
      const response = await fetch(BASE_PATH + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          contact: data.contact.trim(),
          task_type: String(formData.get("task_type") ?? "") || null,
          message: data.message.trim(),
          company_site: String(formData.get("company_site") ?? "") || null,
          source_page: window.location.pathname,
          utm,
          consent_version: CONSENT_VERSION,
          website_check: String(formData.get("website_check") ?? ""),
        }),
      });

      if (!response.ok) {
        setServerError("Не удалось отправить заявку. Проверьте поля и попробуйте ещё раз.");
        setState("error");
        return;
      }

      form.reset();
      setState("sent");
    } catch {
      setServerError("Сеть недоступна. Проверьте соединение и попробуйте снова.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-[rgba(63,191,127,.4)] bg-[rgba(63,191,127,.08)] p-8">
        <p className="text-base font-semibold text-[color:var(--c-success)]">Заявка отправлена</p>
        <p className="mt-2 text-sm text-[color:var(--c-text-muted)]">
          Спасибо! Свяжусь с вами, чтобы обсудить задачу и предложить решение.
        </p>
        <div className="mt-5">
          <Button variant="secondary" onClick={() => setState("idle")}>
            Отправить ещё одну заявку
          </Button>
        </div>
      </div>
    );
  }

  const sending = state === "sending";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="website_check">Не заполняйте</label>
        <input id="website_check" name="website_check" tabIndex={-1} autoComplete="off" />
      </div>

      <TextField
        id="name"
        name="name"
        label="Имя"
        required
        autoComplete="name"
        disabled={sending}
        error={errors.name}
      />
      <TextField
        id="contact"
        name="contact"
        label="Telegram, телефон или e-mail"
        hint="Как удобнее связаться: @username, номер или почта"
        required
        autoComplete="off"
        disabled={sending}
        error={errors.contact}
      />
      <SelectField
        id="task_type"
        name="task_type"
        label="Тип задачи"
        hint="Необязательно, если пока не уверены"
        disabled={sending}
        options={[{ value: "", label: "Не выбрано" }, ...taskOptions]}
      />
      <TextAreaField
        id="message"
        name="message"
        label="Описание задачи"
        hint="Что сейчас делаете вручную и какой результат нужен"
        required
        disabled={sending}
        error={errors.message}
      />
      <TextField
        id="company_site"
        name="company_site"
        label="Сайт компании"
        hint="Необязательно, в формате https://..."
        type="url"
        disabled={sending}
      />

      <div>
        <label className="flex items-start gap-3 text-sm text-[color:var(--c-text-muted)]">
          <input type="checkbox" name="consent" disabled={sending} aria-required="true"
            aria-invalid={errors.consent ? true : undefined}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--c-border)] accent-[color:var(--c-gold)]" />
          <span>
            Согласен с <a href={BASE_PATH + "/privacy/"} className="text-[color:var(--c-gold)] underline">политикой обработки персональных данных</a>.
          </span>
        </label>
        {errors.consent ? (
          <p role="alert" className="mt-1.5 text-xs text-[#E5544B]">
            {errors.consent}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <p role="alert" className="text-sm text-[#E5544B]">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={sending}>
        {sending ? "Отправляем…" : "Обсудить задачу"}
      </Button>
    </form>
  );
}
