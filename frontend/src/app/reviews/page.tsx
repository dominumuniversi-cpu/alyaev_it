/** Отзывы клиентов. Публикуются только с согласия автора.
 *  Пока подтверждённых отзывов нет — страница не существует (404) и не индексируется.
 *  ТЗ раздел 3 и 4.4. Манифест схемы: docs/manifests/db/schema.md, п. 12. */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Section } from "@/components/ui/Section";
import { fetchReviews } from "@/lib/api";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Отзывы клиентов",
  description: "Отзывы о работе с Дмитрием Аляевым: что делали, что получилось. Публикуются только с согласия клиента.",
  alternates: { canonical: canonicalUrl("/reviews/") },
};

/** Форматирует дату отзыва по-русски. */
function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

/** Пустой раздел не публикуем: 404 вместо заглушки (ТЗ 3). */
export default async function ReviewsPage() {
  const reviews = await fetchReviews();
  if (reviews.length === 0) notFound();

  return (
    <Section id="reviews" title="Отзывы клиентов" subtitle="Публикуются с согласия автора и с указанием проекта.">
      <div className="grid gap-4 md:grid-cols-2">
        {reviews.map((review) => (
          <figure
            key={review.author_name + review.text.slice(0, 20)}
            className="rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6"
          >
            <blockquote className="text-base leading-relaxed text-[color:var(--c-text)]">
              {review.text}
            </blockquote>
            <figcaption className="mt-4 text-sm text-[color:var(--c-text-muted)]">
              <span className="font-medium text-[color:var(--c-text)]">{review.author_name}</span>
              {review.author_position ? <span>, {review.author_position}</span> : null}
              {review.project_title ? <span> · {review.project_title}</span> : null}
              {review.published_at ? (
                <span className="mt-1 block text-xs">{formatDate(review.published_at)}</span>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
