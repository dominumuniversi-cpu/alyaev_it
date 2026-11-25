/** Контакты: способы связи и форма заявки. */

import type { Metadata } from "next";

import { LeadForm } from "@/components/site/LeadForm";
import { Section } from "@/components/ui/Section";
import { fetchServices, fetchSettings } from "@/lib/api";
import { canonicalUrl, openGraph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Связаться по задаче автоматизации: Telegram или e-mail. Отвечу на вопросы и предложу решение.",
  alternates: { canonical: canonicalUrl("/contacts/") },
  openGraph: openGraph({
    title: "Контакты — Дмитрий Аляев",
    description: "Связаться по задаче автоматизации: Telegram или e-mail.",
    path: "/contacts/",
    type: "website",
  }),
}

/** Способы связи из настроек БД плюс форма заявки. */
export default async function ContactsPage() {
  const [settings, services] = await Promise.all([fetchSettings(), fetchServices()]);
  const contacts = settings.contacts ?? {};
  const taskOptions = services.map((service) => ({ value: service.slug, label: service.title }));
  // Названия услуг нужны форме, чтобы расшифровать ?service=<slug> из ссылки калькулятора.
  const serviceTitles: Record<string, string> = {};
  for (const service of services) serviceTitles[service.slug] = service.title;

  return (
    <Section
      headingLevel={1}
          flat
          backdrop="bgWave"
      id="contacts"
      breadcrumbs={[{ label: "Главная", href: "/" }, { label: "Контакты" }]} title="Контакты" subtitle="Опишите задачу — отвечу и предложу вариант решения.">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
          <h2 className="mb-3 text-base font-semibold">Как связаться напрямую</h2>
          {contacts.telegram ? (
            <div className="mt-3">
              <p className="mb-3 text-base">Telegram: <span className="text-[color:var(--c-gold)]">{contacts.telegram}</span></p>
              <a
                href={contacts.telegram_url || "https://t.me/" + contacts.telegram.replace(/^@/, "")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[color:var(--c-gold)] px-5 py-2.5 text-sm font-semibold text-[#0A0C12] no-underline transition-colors hover:bg-[#EFCF98]"
              >
                Написать в Telegram
              </a>
            </div>
          ) : null}
          {contacts.email ? (
            <p className="mt-2 text-base">
              E-mail: <span className="text-[color:var(--c-gold)]">{contacts.email}</span>
            </p>
          ) : null}
          <p className="mt-6 text-sm leading-relaxed text-[color:var(--c-text-muted)]">
            Если удобнее формой — заполните её справа. Поля со звёздочкой обязательны.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[color:var(--c-text-muted)]">
            Данные из формы использую только чтобы ответить на вашу заявку.
          </p>
        </div>
        <div id="lead" className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6 sm:p-8">
          <h2 className="mb-6 text-base font-semibold">Оставить заявку</h2>
          <LeadForm taskOptions={taskOptions} serviceTitles={serviceTitles} />
        </div>
      </div>
    </Section>
  );
}