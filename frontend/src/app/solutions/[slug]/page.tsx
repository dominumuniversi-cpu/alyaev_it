/** Карточка готового решения (ТЗ 7.4). Манифест: docs/manifests/ui/solutions-library.md */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { Section } from "@/components/ui/Section";
import { fetchSolutionItem, type SolutionFull } from "@/lib/api";
import { canonicalUrl, openGraph } from "@/lib/seo";

type Params = { slug: string };

/** Подписи типов решений — те же, что в каталоге и админке. */
const KIND_LABELS: Record<string, string> = {
  bot: "Telegram-бот",
  ai: "AI-ассистент",
  parser: "Парсер",
  report: "Отчёты",
  integration: "Интеграция",
  script: "Скрипт",
};

/** Цена решения в том же формате, что у услуг. */
function formatPrice(item: SolutionFull): string {
  if (item.price_on_request || item.price_from === null) return "по запросу";
  return "от " + item.price_from.toLocaleString("ru-RU") + " \u20BD";
}

/** Обычный текст markdown с заголовками ## на блоки React. */
function renderBody(md: string) {
  return md
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block, i) =>
      block.startsWith("## ") ? (
        <h2 key={i} className="mt-8 mb-3 text-xl font-semibold">{block.slice(3)}</h2>
      ) : (
        <p key={i} className="mb-4 leading-relaxed text-[color:var(--c-muted)]">{block}</p>
      )
    );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await fetchSolutionItem(slug);
  if (!item) return { title: "Решение не найдено" };
  return {
    title: item.title,
    description: item.summary,
    alternates: { canonical: canonicalUrl("/solutions/" + slug + "/") },
    openGraph: openGraph({
      title: item.title + " — Дмитрий Аляев",
      description: item.summary,
      path: "/solutions/" + slug + "/",
      type: "website",
    }),
  };
}

export default async function SolutionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const item = await fetchSolutionItem(slug);
  if (!item) notFound();

  return (
    <Section
      headingLevel={1}
      id="solution"
      breadcrumbs={[
        { label: "Главная", href: "/" },
        { label: "Готовые решения", href: "/solutions/" },
        { label: item.title },
      ]}
      title={item.title}
      subtitle={item.summary}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: item.title,
          description: item.summary,
          provider: { "@type": "Person", name: "Дмитрий Аляев" },
          ...(item.price_from !== null && !item.price_on_request
            ? {
                offers: {
                  "@type": "Offer",
                  priceCurrency: "RUB",
                  price: item.price_from,
                  description: "Стартовая цена внедрения",
                },
              }
            : {}),
        }}
      />

      <div className="mb-8 flex flex-wrap gap-2">
        <Badge variant="price">{formatPrice(item)}</Badge>
        <Badge variant="tech">{KIND_LABELS[item.kind] ?? item.kind}</Badge>
      </div>

      {item.included.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Что входит</h2>
          <ul className="list-disc space-y-2 pl-6 text-[color:var(--c-muted)]">
            {item.included.map((i) => <li key={i}>{i}</li>)}
          </ul>
        </section>
      ) : null}

      {item.requirements_md ? (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Что нужно от вас</h2>
          {renderBody(item.requirements_md)}
        </section>
      ) : null}

      {item.description_md ? (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Как устроено</h2>
          {renderBody(item.description_md)}
        </section>
      ) : null}

      {item.technologies.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Технологии</h2>
          <div className="flex flex-wrap gap-2">
            {item.technologies.map((t) => <Badge key={t} variant="muted">{t}</Badge>)}
          </div>
        </section>
      ) : null}

      {/* Ссылка на демо — только если она реальная. Нерабочая хуже отсутствующей. */}
      {item.demo_url ? (
        <p className="mb-8">
          <a
            href={item.demo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[color:var(--c-terra-ink)] hover:underline"
          >
            Посмотреть в работе →
          </a>
        </p>
      ) : null}

      <p className="mb-6 rounded-xl border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-4 text-sm text-[color:var(--c-muted)]">
        Указанные цены являются стартовыми. Итоговая стоимость внедрения определяется
        после анализа задачи. Расходы на сервер, токены моделей и внешние сервисы
        не входят в стоимость внедрения.
      </p>

      <ButtonLink href="/contacts/" size="lg">Обсудить внедрение</ButtonLink>
    </Section>
  );
}
