/** Бесплатный разбор процесса. Манифест: docs/manifests/ui/diagnostics.md */

import type { Metadata } from "next";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Section } from "@/components/ui/Section";
import { canonicalUrl, openGraph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Бесплатный разбор бизнес-процесса",
  description:
    "Разберу один процесс: где теряется время, что можно автоматизировать и с чего начать. Честная оценка сложности без обязательств.",
  alternates: { canonical: canonicalUrl("/diagnostics/") },
  openGraph: openGraph({
    title: "Бесплатный разбор бизнес-процесса — Дмитрий Аляев",
    description: "Разберу один процесс: где теряется время, что можно автоматизировать и с чего начать.",
    path: "/diagnostics/",
    type: "website",
  }),
}

const OUTCOMES = [
  { title: "Разбираем один процесс", text: "Берём конкретный процесс, а не весь бизнес — иначе разбор растянется на месяц." },
  { title: "Показываю, где теряется время", text: "Конкретные шаги: что делается руками, где ждут, где переделывают." },
  { title: "Оцениваю сложность честно", text: "«День работы» и «месяц» — разные ответы. Скажу как есть, даже если это «не надо»." },
  { title: "Предлагаю вариант решения", text: "Словами, понятными клиенту: что автоматизируем, что оставляем людям и почему." },
];

const STEPS = [
  { title: "Оставляете заявку", text: "Опишите процесс своими словами. Технические термины не нужны." },
  { title: "Созваниваемся и разбираем", text: "Выясняю, как процесс идёт на самом деле, а не как записано в регламенте." },
  { title: "Получаете вывод", text: "Где точки автоматизации, сколько это примерно стоит и стоит ли начинать." },
];

/** Честный фильтр: кому разбор не нужен. */
const NOT_FOR = [
  "Нужна разработка по готовому ТЗ — это сразу проект, а не разбор.",
  "Нужна поддержка работающей системы — это отдельная услуга.",
  "Нужен разбор всего бизнеса целиком — так не бывает за один разговор.",
];

export default async function DiagnosticsPage() {
  return (
    <>
      <Section
        headingLevel={1}
          flat
        id="diagnostics"
        breadcrumbs={[{ label: "Главная", href: "/" }, { label: "Разбор процесса" }]}
        title="Бесплатный разбор бизнес-процесса"
        subtitle="Посмотрю, как идёт один процесс, покажу, где теряется время, и скажу, с чего начать автоматизацию — или что начинать не стоит."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {OUTCOMES.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-5">
              <h2 className="mb-2 text-base font-semibold">{item.title}</h2>
              <p className="text-sm leading-relaxed text-[color:var(--c-text-muted)]">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="diagnostics-steps" title="Как это происходит" surface>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-bg)] p-5">
              <Badge variant="tech">Шаг {index + 1}</Badge>
              <h3 className="mb-2 mt-3 text-base font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-[color:var(--c-text-muted)]">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="diagnostics-limits" title="Чего здесь не будет">
        <ul className="max-w-3xl space-y-2 text-sm leading-relaxed text-[color:var(--c-text-muted)]">
          {NOT_FOR.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-[color:var(--c-danger)]">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[color:var(--c-text-muted)]">
          Точную смету и готовое техзадание разбор не заменяет — это следующий шаг, если он имеет смысл.
        </p>
      </Section>

      <Section id="diagnostics-form" title="Оставить заявку на разбор" surface>
        <div className="max-w-2xl">
          <p className="mb-5 text-sm leading-relaxed text-[color:var(--c-text-muted)]">
            Заявка уходит в общую форму — отдельной анкеты нет: смысл разбора в разговоре, а не в заполнении полей.
          </p>
          {/* Источник передаётся ссылкой: LeadForm читает ?source= из адреса, а не из пропса. */}
          <Link
            href="/contacts/?source=diagnostics"
            className="inline-flex items-center justify-center rounded-xl bg-[color:var(--c-gold)] px-6 py-3 text-sm font-semibold text-[color:var(--c-bg)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--c-gold)]"
          >
            Оставить заявку на разбор
          </Link>
        </div>
      </Section>
    </>
  );
}
