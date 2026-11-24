/** Публичная страница раздела. */

import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Блог",
  description: "Готовлю материалы о практической автоматизации: разборы сценариев, ограничения технологий и стоимость решений. Следите за обновлениями.",
  alternates: { canonical: canonicalUrl("/blog/") },
  openGraph: {
    title: "Блог — Дмитрий Аляев",
    description: "Готовлю материалы о практической автоматизации: разборы сценариев, ограничения технологий и стоимость решений. Следите за обновлениями.",
    url: canonicalUrl("/blog/"),
    type: "website",
  },
  robots: { index: false, follow: true },
};

/** Раздел без ложных обещаний и пустых блоков. */
export default function Page() {
  return (
    <Section id="page"
      breadcrumbs={[{ label: "Главная", href: "/" }, { label: "Блог" }]} title={"Статьи и разборы"}>
      <p className="max-w-2xl text-base leading-relaxed text-[color:var(--c-text-muted)]">
        {"Готовлю материалы о практической автоматизации: разборы сценариев, ограничения технологий и стоимость решений. Следите за обновлениями."}
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