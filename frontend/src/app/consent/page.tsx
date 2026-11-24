/** Публичная страница раздела. */

import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Согласие на обработку данных",
  description: "Текст согласия публикуется вместе с политикой обработки данных и до запуска формы заявки.",
  alternates: { canonical: canonicalUrl("/consent/") },
  openGraph: {
    title: "Согласие на обработку данных — Дмитрий Аляев",
    description: "Текст согласия публикуется вместе с политикой обработки данных и до запуска формы заявки.",
    url: canonicalUrl("/consent/"),
    type: "website",
  },
  robots: { index: false, follow: true },
};

/** Раздел без ложных обещаний и пустых блоков. */
export default function Page() {
  return (
    <Section id="page" title={"Согласие на обработку персональных данных"}>
      <p className="max-w-2xl text-base leading-relaxed text-[color:var(--c-text-muted)]">
        {"Текст согласия публикуется вместе с политикой обработки данных и до запуска формы заявки."}
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