/** Временная публичная страница раздела. */

import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Согласие на обработку данных",
  description: "Текст согласия публикуется вместе с политикой обработки данных и до запуска формы заявки.",
  alternates: { canonical: "/consent/" },
  robots: { index: false, follow: true },
};

/** Раздел в разработке: без ложных обещаний и пустых блоков. */
export default function Page() {
  return (
    <Section id="page" title={"Согласие на обработку персональных данных"}>
      <p className="max-w-2xl text-base leading-relaxed text-[color:var(--c-text-muted)]">
        {
          "Текст согласия публикуется вместе с политикой обработки данных и до запуска формы заявки."
        }
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