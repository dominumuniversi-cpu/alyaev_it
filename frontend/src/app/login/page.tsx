/** Публичная страница раздела. */

import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Вход для клиентов",
  description: "Личный кабинет откроется после запуска первого этапа. Учётные записи создаются после старта проекта.",
  alternates: { canonical: canonicalUrl("/login/") },
  openGraph: {
    title: "Вход для клиентов — Дмитрий Аляев",
    description: "Личный кабинет откроется после запуска первого этапа. Учётные записи создаются после старта проекта.",
    url: canonicalUrl("/login/"),
    type: "website",
  },
  robots: { index: false, follow: true },
};

/** Раздел без ложных обещаний и пустых блоков. */
export default function Page() {
  return (
    <Section id="page" title={"Вход в личный кабинет"}>
      <p className="max-w-2xl text-base leading-relaxed text-[color:var(--c-text-muted)]">
        {"Личный кабинет откроется после запуска первого этапа. Учётные записи создаются после старта проекта."}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/contacts/#lead">Обсудить задачу</ButtonLink>
        <ButtonLink href="/services/" variant="secondary">
          Услуги и цены
        </ButtonLink>
      </div>
    </Section>
  );
}