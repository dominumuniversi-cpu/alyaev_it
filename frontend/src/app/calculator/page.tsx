/** Временная публичная страница раздела. */

import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Калькулятор",
  description: "Калькулятор будет считать стоимость по ценам из базы, а не по цифрам, зашитым в интерфейс. Пока оценку даю после короткого обсуждения задачи.",
  alternates: { canonical: "/calculator/" },
  robots: { index: false, follow: true },
};

/** Раздел в разработке: без ложных обещаний и пустых блоков. */
export default function Page() {
  return (
    <Section id="page" title={"Предварительная оценка"}>
      <p className="max-w-2xl text-base leading-relaxed text-[color:var(--c-text-muted)]">
        {
          "Калькулятор будет считать стоимость по ценам из базы, а не по цифрам, зашитым в интерфейс. Пока оценку даю после короткого обсуждения задачи."
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