/** Форма заявки: fetch без перезагрузки. Манифест: docs/manifests/ui/field.md */

"use client";

import { useEffect, useState } from "react";

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

/** Собирает приписку о расчёте калькулятора из параметров ссылки (манифест: lead-form.md).
 *  Клиент видит, что его расчёт дошёл, и может стереть это одной клавишей. */
function calculatorNote(params: URLSearchParams, serviceTitles: Record<string, string>): string {
  if (params.get("source") !== "calculator") return "";
  const slug = params.get("service") ?? "";
  const price = params.get("price") ?? "";
  const options = (params.get("options") ?? "").split(",").filter(Boolean);
  const title = serviceTitles[slug] ?? slug;
  if (!title && !price) return "";
  const parts = ["Расчёт с калькулятора: " + title];
  if (options.length > 0) parts.push("опции: " + options.join(", "));
  if (price) parts.push("предварительно " + Number(price).toLocaleString("ru-RU") + " ₽");
  return parts.join(", ") + ".";
}

/** Форма заявки: отправка через fetch, без перезагрузки страницы. */
export function LeadForm({
  taskOptions,
  serviceTitles = {},
}: {
  taskOptions: { value: string; label: string }[];
  serviceTitles?: Record<string, string>;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [messageDefault, setMessageDefault] = useState("");
  const [taskDefault, setTaskDefault] = useState("");

  // Параметры расчёта читаем только в браузере: на сервере location нет.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMessageDefault(calculatorNote(params, serviceTitles));
    // Услуга из ссылки калькулятора сразу подставляет тип задачи — клиенту не надо выбирать заново.
    setTaskDefault(params.get("service") ?? "");
  }, [serviceTitles]);

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
      const response = await fetch(BASE_PATH + "/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          contact: data.contact.trim(),
          task_type: String(formData.get("task_type") ?? "") || null,
          message: data.message.trim(),
          company_site: String(formData.get("company_site") ?? "") || null,
          // Если пришли с калькулятора — в источнике это видно, а не просто /contacts/.
          source_page:
            params.get("source") === "calculator"
              ? window.location.pathname + "?source=calculator"
              : window.location.pathname,
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
        defaultValue={taskDefault}
        options={[{ value: "", label: "Не выбрано" }, ...taskOptions]}
      />
      <TextAreaField
        id="message"
        name="message"
        label="Описание задачи"
        hint="Что сейчас делаете вручную и какой результат нужен"
        defaultValue={messageDefault}
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
            Даю <a href={BASE_PATH + "/personal-data-consent/"} className="text-[color:var(--c-gold)] underline">согласие на обработку персональных данных</a> на условиях <a href={BASE_PATH + "/privacy/"} className="text-[color:var(--c-gold)] underline">политики</a>.
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