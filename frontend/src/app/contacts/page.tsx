/** Контакты: способы связи и (позже) форма заявки. */

import type { Metadata } from "next";

import { Section } from "@/components/ui/Section";
import { fetchSettings } from "@/lib/api";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Связаться по задаче автоматизации: Telegram или e-mail. Отвечу на вопросы и предложу решение.",
  alternates: { canonical: canonicalUrl("/contacts/") },
  openGraph: {
    title: "Контакты — Дмитрий Аляев",
    description: "Связаться по задаче автоматизации: Telegram или e-mail.",
    url: canonicalUrl("/contacts/"),
    type: "website",
  },
};

/** Способы связи из настроек БД. */
export default async function ContactsPage() {
  const settings = await fetchSettings();
  const contacts = settings.contacts ?? {};

  return (
    <Section
      id="contacts"
      title="Контакты"
      subtitle="Опишите задачу — отвечу и предложу вариант решения."
    >
      <div id="lead" className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-8">
        <p className="text-base leading-relaxed text-[color:var(--c-text-muted)]">
          Форма заявки появится на этом месте. Пока пишите напрямую в Telegram.
        </p>
        {contacts.telegram ? (
          <p className="mt-4 text-base">
            Telegram: <span className="text-[color:var(--c-gold)]">{contacts.telegram}</span>
          </p>
        ) : null}
        {contacts.email ? (
          <p className="mt-2 text-base">
            E-mail: <span className="text-[color:var(--c-gold)]">{contacts.email}</span>
          </p>
        ) : null}
      </div>
    </Section>
  );
}