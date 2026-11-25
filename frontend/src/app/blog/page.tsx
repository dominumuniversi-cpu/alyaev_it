/** Блог: лента статей из админки. ТЗ 11.9, 12.3. */

import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { fetchArticles } from "@/lib/api";
import { canonicalUrl, openGraph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Блог",
  description: "Готовлю материалы о практической автоматизации: разборы сценариев, ограничения технологий и стоимость решений. Следите за обновлениями.",
  alternates: { canonical: canonicalUrl("/blog/") },
  openGraph: openGraph({
    title: "Блог — Дмитрий Аляев",
    description: "Готовлю материалы о практической автоматизации: разборы сценариев, ограничения технологий и стоимость решений. Следите за обновлениями.",
    path: "/blog/",
    type: "website",
  }),
  robots: { index: false, follow: true },
};

/** Дата статьи в читаемом виде; пустая строка, если даты нет. */
function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

/** Лента статей. Пока статей нет — честный текст вместо пустого списка. */
export default async function Page() {
  const articles = await fetchArticles();

  return (
    <Section
      headingLevel={1}
          flat
      id="page"
      breadcrumbs={[{ label: "Главная", href: "/" }, { label: "Блог" }]} title={"Статьи и разборы"}>
      {articles.length === 0 ? (
        <p className="max-w-2xl text-base leading-relaxed text-[color:var(--c-text-muted)]">
          {"Готовлю материалы о практической автоматизации: разборы сценариев, ограничения технологий и стоимость решений. Следите за обновлениями."}
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {articles.map((article) => (
            <article key={article.slug} className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
              {article.published_at ? (
                <time className="text-xs uppercase tracking-wide text-[color:var(--c-text-muted)]" dateTime={article.published_at}>
                  {formatDate(article.published_at)}
                </time>
              ) : null}
              <h2 className="mt-2 mb-3 text-lg font-semibold leading-snug">
                <Link href={"/blog/" + article.slug} className="hover:text-[color:var(--c-terra-ink)]">
                  {article.title}
                </Link>
              </h2>
              {article.excerpt ? (
                <p className="text-sm leading-relaxed text-[color:var(--c-text-muted)]">{article.excerpt}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/contacts/#lead">Обсудить задачу</ButtonLink>
        <ButtonLink href="/services/" variant="secondary">
          Услуги и цены
        </ButtonLink>
      </div>
    </Section>
  );
}
