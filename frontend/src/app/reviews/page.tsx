/** Публичная страница раздела. */

import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Отзывы",
  description: "Отзывы появляются только с согласия клиентов и с указанием выполненного проекта. Пока их нет — блок не публикуется.",
  alternates: { canonical: canonicalUrl("/reviews/") },
  openGraph: {
    title: "Отзывы — Дмитрий Аляев",
    description: "Отзывы появляются только с согласия клиентов и с указанием выполненного проекта. Пока их нет — блок не публикуется.",
    url: canonicalUrl("/reviews/"),
    type: "website",
  },
  robots: { index: false, follow: true },
};

/** Раздел без ложных обещаний и пустых блоков. */
export default function Page() {
  return (
    <Section id="page" title={"Отзывы клиентов"}>
      <p className="max-w-2xl text-base leading-relaxed text-[color:var(--c-text-muted)]">
        {"Отзывы появляются только с согласия клиентов и с указанием выполненного проекта. Пока их нет — блок не публикуется."}
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