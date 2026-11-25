/** Библиотека готовых решений (ТЗ 7.4). Манифест: docs/manifests/ui/solutions-library.md */

import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Section } from "@/components/ui/Section";
import { fetchSolutions } from "@/lib/api";
import { canonicalUrl, openGraph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Готовые решения",
  description:
    "Готовые модули автоматизации: Telegram-боты, AI-ассистенты, парсеры, отчёты, интеграции. Внедрение быстрее, чем разработка с нуля.",
  alternates: { canonical: canonicalUrl("/solutions/") },
  openGraph: openGraph({
    title: "Готовые решения — Дмитрий Аляев",
    description: "Готовые модули автоматизации бизнеса: боты, AI-ассистенты, парсеры, интеграции.",
    path: "/solutions/",
    type: "website",
  }),
}

type SolutionCard = {
  slug: string;
  title: string;
  summary: string;
  kind: string;
  technologies: string[];
  price_from: number | null;
  price_on_request: boolean;
};

/** Подписи типов решений — те же, что в админке. */
const KIND_LABELS: Record<string, string> = {
  bot: "Telegram-бот",
  ai: "AI-ассистент",
  parser: "Парсер",
  report: "Отчёты",
  integration: "Интеграция",
  script: "Скрипт",
};

/** Цена решения в том же формате, что у услуг. */
function formatPrice(item: SolutionCard): string {
  if (item.price_on_request || item.price_from === null) return "по запросу";
  return "от " + item.price_from.toLocaleString("ru-RU") + " \u20BD";
}

export default async function SolutionsPage() {
  const items: SolutionCard[] = await fetchSolutions();

  return (
    <Section
      headingLevel={1}
          flat
      id="solutions"
      breadcrumbs={[{ label: "Главная", href: "/" }, { label: "Готовые решения" }]}
      title="Готовые решения"
      subtitle="Модули, которые уже написаны и проверены. Внедрение занимает меньше времени, чем разработка с нуля."
    >
      {items.length === 0 ? (
        <p className="max-w-2xl text-[color:var(--c-muted)]">
          Каталог готовится. Пока посмотрите{" "}
          <Link href="/services/" className="text-[color:var(--c-terra-ink)] hover:underline">
            услуги и цены
          </Link>{" "}
          или{" "}
          <Link href="/contacts/" className="text-[color:var(--c-terra-ink)] hover:underline">
            опишите задачу
          </Link>{" "}
          — предложу, что можно сделать быстрее.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.slug}
              className="flex flex-col rounded-[var(--radius-lg)] border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-6 transition-colors hover:border-[color:var(--c-lime-ink)]"
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="tech">{KIND_LABELS[item.kind] ?? item.kind}</Badge>
              </div>
              <h2 className="mb-2 text-lg font-semibold">
                <Link href={"/solutions/" + item.slug + "/"} className="hover:text-[color:var(--c-lime-ink)]">
                  {item.title}
                </Link>
              </h2>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-[color:var(--c-muted)]">
                {item.summary}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="price">{formatPrice(item)}</Badge>
                {item.technologies.slice(0, 3).map((t) => (
                  <Badge key={t} variant="muted">{t}</Badge>
                ))}
              </div>
              <Link
                href={"/solutions/" + item.slug + "/"}
                className="mt-4 text-sm text-[color:var(--c-terra-ink)] hover:underline"
              >
                Подробнее о решении →
              </Link>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}
