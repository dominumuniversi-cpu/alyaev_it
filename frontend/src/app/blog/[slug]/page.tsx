/** Одна статья блога: SSR по слагу. ТЗ 11.6 Schema.org Article, 11.5 canonical. */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { fetchArticle, fetchRelatedArticles, fetchServicesForArticle, formatPrice } from "@/lib/api";
import { canonicalUrl, openGraph } from "@/lib/seo";

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
    openGraph: openGraph({
      title: article.title + " — Дмитрий Аляев",
      description: article.excerpt || undefined,
      path: "/blog/" + article.slug + "/",
      type: "article",
      extra: { publishedTime: article.published_at ?? undefined },
    }),
  };
}

/** Абзацы из markdown: заголовки ##, таблицы, списки и обычный текст. */
function renderBody(md: string) {
  // Строки таблицы склеиваем в один блок: автор текста обычно оставляет пустую
  // строку между строками, и без склейки таблица распадается на абзацы с «|».
  const lines = md.split("\n");
  const merged: string[] = [];
  for (const line of lines) {
    const isTableRow = line.trim().startsWith("|");
    const lastFilled = [...merged].reverse().find((l) => l.trim() !== "");
    const previousIsTableRow = lastFilled !== undefined && lastFilled.trim().startsWith("|");
    if (isTableRow && previousIsTableRow) {
      // Выкидываем пустые строки между строками таблицы.
      while (merged.length > 0 && merged[merged.length - 1].trim() === "") merged.pop();
    }
    merged.push(line);
  }
  const joined = merged.join("\n");
  const blocks = joined.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    if (block.startsWith("## ")) {
      return (
        <h2 key={index} className="mt-8 mb-3 text-xl font-semibold">
          {block.slice(3)}
        </h2>
      );
    }

    // Таблица: первая строка — заголовки, вторая — разделитель |---|, дальше строки.
    const lines = block.split("\n").filter(Boolean);
    if (lines.length >= 2 && lines[0].startsWith("|") && /\|\s*-{2,}/.test(lines[1])) {
      const cells = (line: string) =>
        line.split("|").slice(1, -1).map((c) => c.trim());
      const head = cells(lines[0]);
      const rows = lines.slice(2).map(cells);
      return (
        <div key={index} className="mb-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[color:var(--c-line)] text-left">
                {head.map((h) => (
                  <th key={h} className="py-2 pr-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.join("-")} className="border-b border-[color:var(--c-line)]">
                  {row.map((cell, i) => (
                    <td key={i} className="py-2 pr-4">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Список: все строки начинаются с - или *.
    if (lines.every((l) => /^[-*]\s/.test(l))) {
      return (
        <ul key={index} className="mb-4 list-disc space-y-2 pl-6 text-[color:var(--c-muted)]">
          {lines.map((l) => (
            <li key={l}>{renderInline(l.replace(/^[-*]\s+/, ""))}</li>
          ))}
        </ul>
      );
    }

    // Жирный текст **...** внутри абзаца иначе выводился бы звёздочками.
    return (
      <p key={index} className="mb-4 text-base leading-relaxed text-[color:var(--c-muted)]">
        {renderInline(block)}
      </p>
    );
  });
}

/** Разбор **жирного** внутри строки на куски React. */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-[color:var(--c-ink)]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

/** Статья целиком. Черновик и удалённая отдают 404 — как и обещает публичный API. */
export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) notFound();
  // Услуги по теме статьи: перелинковка ТЗ 11.10.
  const related = await fetchServicesForArticle(article.slug);
  // «Читайте также»: перелинковка статей между собой (ТЗ 11.10).
  const alsoRead = await fetchRelatedArticles(article.slug);

  return (
    <Section
      headingLevel={1}
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
      {alsoRead.length > 0 ? (
        <div className="mt-10">
          <h2 className="mb-3 text-base font-semibold">Читайте также</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {alsoRead.map((item) => (
              <li key={item.slug}>
                <Link
                  href={"/blog/" + item.slug + "/"}
                  className="flex h-full flex-col rounded-[var(--radius-md)] border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-4 transition-colors hover:border-[color:var(--c-lime-ink)]"
                >
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {related.length > 0 ? (
        <div className="mt-10">
          <h2 className="mb-3 text-base font-semibold">Услуги по теме статьи</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={"/services/" + item.slug + "/"}
                  className="flex h-full flex-col rounded-[var(--radius-md)] border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-4 transition-colors hover:border-[color:var(--c-lime-ink)]"
                >
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="mt-1 text-xs leading-relaxed text-[color:var(--c-muted)]">
                    {item.short_description}
                  </span>
                  <span className="mt-2 text-xs text-[color:var(--c-lime-ink)]">{formatPrice(item)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-10 rounded-[var(--radius-lg)] border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-6">
        <p className="text-sm text-[color:var(--c-muted)]">
          Если в вашем бизнесе есть похожая задача — обсудим, что именно стоит автоматизировать.
        </p>
        <div className="mt-4">
          <ButtonLink href="/contacts/#lead">Обсудить задачу</ButtonLink>
        </div>
      </div>
    </Section>
  );
}
