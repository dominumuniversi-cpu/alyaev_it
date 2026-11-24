/** Одна статья блога: SSR по слагу. ТЗ 11.6 Schema.org Article, 11.5 canonical. */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { fetchArticle } from "@/lib/api";
import { canonicalUrl } from "@/lib/seo";

type Params = { slug: string };

/** Метаданные статьи из её полей; черновик не индексируется, потому что его не существует. */
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) {
    return { title: "Статья не найдена", robots: { index: false, follow: false } };
  }
  const url = canonicalUrl("/blog/" + article.slug);
  return {
    title: article.title,
    description: article.excerpt || undefined,
    alternates: { canonical: url },
    openGraph: {
      title: article.title + " — Дмитрий Аляев",
      description: article.excerpt || undefined,
      url,
      type: "article",
      publishedTime: article.published_at ?? undefined,
    },
  };
}

/** Абзацы из markdown: заголовки ## и обычный текст. Полноценный парсер здесь не нужен. */
function renderBody(md: string) {
  const blocks = md.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    if (block.startsWith("## ")) {
      return (
        <h2 key={index} className="mt-8 mb-3 text-xl font-semibold">
          {block.slice(3)}
        </h2>
      );
    }
    return (
      <p key={index} className="mb-4 text-base leading-relaxed text-[color:var(--c-text-muted)]">
        {block}
      </p>
    );
  });
}

/** Статья целиком. Черновик и удалённая отдают 404 — как и обещает публичный API. */
export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) notFound();

  return (
    <Section
      id="article"
      breadcrumbs={[
        { label: "Главная", href: "/" },
        { label: "Блог", href: "/blog/" },
        { label: article.title },
      ]}
      title={article.title}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt || undefined,
          datePublished: article.published_at ?? undefined,
          url: canonicalUrl("/blog/" + article.slug),
          author: { "@type": "Person", name: "Дмитрий Аляев" },
        }}
      />
      <article className="max-w-2xl">{renderBody(article.body_md)}</article>
      <div className="mt-10 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
        <p className="text-sm text-[color:var(--c-text-muted)]">
          Если в вашем бизнесе есть похожая задача — обсудим, что именно стоит автоматизировать.
        </p>
        <div className="mt-4">
          <ButtonLink href="/contacts/#lead">Обсудить задачу</ButtonLink>
        </div>
      </div>
    </Section>
  );
}
