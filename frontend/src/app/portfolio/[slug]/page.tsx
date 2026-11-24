/** Страница кейса портфолио: SSR по слагу. ТЗ 5 блок 6, 11.6. */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { fetchPortfolioItem, PORTFOLIO_STATUS_LABELS } from "@/lib/api";
import { canonicalUrl, openGraph } from "@/lib/seo";

type Params = { slug: string };

/** Метаданные кейса; неопубликованный отдаёт noindex, раз его нет. */
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await fetchPortfolioItem(slug);
  if (!item) {
    return { title: "Проект не найден", robots: { index: false, follow: false } };
  }
  const url = canonicalUrl("/portfolio/" + item.slug);
  return {
    title: item.title,
    description: item.summary,
    alternates: { canonical: url },
    openGraph: openGraph({ title: item.title + " — Дмитрий Аляев", description: item.summary, path: "/portfolio/" + item.slug + "/", type: "article" }),
  };
}

/** Абзацы из markdown: заголовки ## и обычный текст. */
function renderBody(md: string) {
  const blocks = md.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block, index) =>
    block.startsWith("## ") ? (
      <h2 key={index} className="mt-8 mb-3 text-xl font-semibold">
        {block.slice(3)}
      </h2>
    ) : (
      <p key={index} className="mb-4 text-base leading-relaxed text-[color:var(--c-text-muted)]">
        {block}
      </p>
    ),
  );
}

/** Кейс целиком. Неопубликованный и удалённый отдают 404. */
export default async function PortfolioItemPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const item = await fetchPortfolioItem(slug);
  if (!item) notFound();

  const statusLabel = PORTFOLIO_STATUS_LABELS[item.status] ?? item.status;

  return (
    <Section
      headingLevel={1}
      id="case"
      breadcrumbs={[
        { label: "Главная", href: "/" },
        { label: "Портфолио", href: "/portfolio/" },
        { label: item.title },
      ]}
      title={item.title}
      subtitle={item.summary}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: item.title,
          description: item.summary,
          url: canonicalUrl("/portfolio/" + item.slug),
          keywords: item.technologies.join(", "),
          author: { "@type": "Person", name: "Дмитрий Аляев" },
        }}
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Статус честный: демонстрация не выдаётся за внедрение. */}
        <Badge variant="status">{statusLabel}</Badge>
        {item.technologies.map((tech) => (
          <Badge key={tech} variant="tech">
            {tech}
          </Badge>
        ))}
      </div>
      <div className="max-w-2xl">
        {item.problem_md ? (
          <>
            <h2 className="mt-2 mb-3 text-xl font-semibold">Проблема</h2>
            {renderBody(item.problem_md)}
          </>
        ) : null}
        {item.solution_md ? (
          <>
            <h2 className="mt-8 mb-3 text-xl font-semibold">Как устроено решение</h2>
            {renderBody(item.solution_md)}
          </>
        ) : null}
      </div>
      <div className="mt-10 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
        <p className="text-sm text-[color:var(--c-text-muted)]">
          Похожая задача в вашем бизнесе? Обсудим, что именно стоит автоматизировать.
        </p>
        <div className="mt-4">
          <ButtonLink href="/contacts/#lead">Обсудить задачу</ButtonLink>
        </div>
      </div>
    </Section>
  );
}
