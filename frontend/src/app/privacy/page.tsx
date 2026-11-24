/** Публичная страница раздела. */

import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Документ готовится: цели, состав и сроки обработки данных, порядок удаления и отзыв согласия. До публикации формы заявки персональные данные не собира",
  alternates: { canonical: canonicalUrl("/privacy/") },
  openGraph: {
    title: "Политика конфиденциальности — Дмитрий Аляев",
    description: "Документ готовится: цели, состав и сроки обработки данных, порядок удаления и отзыв согласия. До публикации формы заявки персональные данные не собира",
    url: canonicalUrl("/privacy/"),
    type: "website",
  },
  robots: { index: false, follow: true },
};

/** Раздел без ложных обещаний и пустых блоков. */
export default function Page() {
  return (
    <Section id="page" title={"Политика обработки персональных данных"}>
      <p className="max-w-2xl text-base leading-relaxed text-[color:var(--c-text-muted)]">
        {"Документ готовится: цели, состав и сроки обработки данных, порядок удаления и отзыв согласия. До публикации формы заявки персональные данные не собираются."}
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