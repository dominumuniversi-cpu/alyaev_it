/** Публичная страница раздела. */

import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Портфолио",
  description: "Раздел наполняется демонстрационными проектами: каждый кейс описывает проблему, архитектуру решения и используемые технологии. Пока материал готовится",
  alternates: { canonical: canonicalUrl("/portfolio/") },
  openGraph: {
    title: "Портфолио — Дмитрий Аляев",
    description: "Раздел наполняется демонстрационными проектами: каждый кейс описывает проблему, архитектуру решения и используемые технологии. Пока материал готовится",
    url: canonicalUrl("/portfolio/"),
    type: "website",
  },
  robots: { index: false, follow: true },
};

/** Раздел без ложных обещаний и пустых блоков. */
export default function Page() {
  return (
    <Section id="page" title={"Проекты и решения"}>
      <p className="max-w-2xl text-base leading-relaxed text-[color:var(--c-text-muted)]">
        {"Раздел наполняется демонстрационными проектами: каждый кейс описывает проблему, архитектуру решения и используемые технологии. Пока материал готовится, посмотрите услуги и цены."}
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