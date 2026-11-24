/** Публичная страница раздела. */

import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Обо мне",
  description: "В IT с 2007 года: корпоративные системы, инфраструктура, автоматизация процессов и интеграции. Страница с подробным опытом готовится.",
  alternates: { canonical: canonicalUrl("/about/") },
  openGraph: {
    title: "Обо мне — Дмитрий Аляев",
    description: "В IT с 2007 года: корпоративные системы, инфраструктура, автоматизация процессов и интеграции. Страница с подробным опытом готовится.",
    url: canonicalUrl("/about/"),
    type: "website",
  },
  robots: { index: false, follow: true },
};

/** Раздел без ложных обещаний и пустых блоков. */
export default function Page() {
  return (
    <Section id="page" title={"Обо мне и опыте"}>
      <p className="max-w-2xl text-base leading-relaxed text-[color:var(--c-text-muted)]">
        {"В IT с 2007 года: корпоративные системы, инфраструктура, автоматизация процессов и интеграции. Страница с подробным опытом готовится."}
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