/** Посадочная страница услуги: цена, сроки, состав, FAQ. */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { JsonLd, serviceSchema } from "@/components/seo/JsonLd";
import { type CategoryFull, fetchCategory, fetchService, formatPrice } from "@/lib/api";
import { canonicalUrl, siteBase } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

/** Метаданные услуги из БД; 404 если услуги нет. */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service = await fetchService(slug);
  if (!service) {
    // Слаг может быть категорией: /services/telegram-bots/
    const category = await fetchCategory(slug);
    if (!category) return { title: "Страница не найдена" };
    return {
      title: category.title,
      description: category.short_description,
      alternates: { canonical: canonicalUrl("/services/" + category.slug) },
    };
  }
  return {
    title: service.title,
    description: service.short_description,
    alternates: { canonical: canonicalUrl("/services/" + service.slug) },
    openGraph: {
      title: service.title,
      description: service.short_description,
      url: canonicalUrl("/services/" + service.slug),
      type: "website",
    },
  };
};

const List = ({ items, tone }: { items: string[]; tone: "plus" | "minus" }) =>
  items.length === 0 ? null : (
    <ul className="space-y-2 text-sm text-[color:var(--c-text-muted)]">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span
            aria-hidden="true"
            className={tone === "plus" ? "text-[color:var(--c-success)]" : "text-[color:var(--c-danger)]"}
          >
            {tone === "plus" ? "✓" : "−"}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );

/** Страница категории услуг: список услуг, цены, CTA. */
function CategoryPage({ category }: { category: CategoryFull }) {
  return (
    <>
      <Section
        id="category"
        title={category.title}
        subtitle={category.short_description}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {category.services.map((service) => (
            <article
              key={service.slug}
              className="flex flex-col rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold">{service.title}</h3>
                <span className="whitespace-nowrap text-sm text-[color:var(--c-gold)]">
                  {formatPrice(service)}
                </span>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-[color:var(--c-text-muted)]">
                {service.short_description}
              </p>
              {service.examples.length > 0 ? (
                <ul className="mb-4 space-y-1.5 text-sm text-[color:var(--c-text-muted)]">
                  {service.examples.slice(0, 3).map((example) => (
                    <li key={example} className="flex gap-2">
                      <span aria-hidden="true" className="text-[color:var(--c-cyan)]">→</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                <span className="text-xs text-[color:var(--c-text-muted)]">Срок: {service.duration_text}</span>
                <ButtonLink href={"/services/" + service.slug} variant="secondary">Подробнее</ButtonLink>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section id="category-cta" title="Не нашли подходящий формат?">
        <p className="mb-5 max-w-2xl text-[color:var(--c-text-muted)]">
          Опишите задачу — предложу решение и предварительно оценю стоимость.
        </p>
        <ButtonLink href="/contacts/" size="lg">Обсудить задачу</ButtonLink>
      </Section>
    </>
  );
}
/** Карточка услуги с обязательным набором блоков из ТЗ. */
export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  const service = await fetchService(slug);
  if (!service) {
    const category = await fetchCategory(slug);
    if (!category) notFound();
    return <CategoryPage category={category} />;
  }

  return (
    <>
    <JsonLd
      data={serviceSchema({
        site: siteBase(),
        name: service.title,
        description: service.short_description,
        priceFrom: service.price_on_request ? null : service.price_from,
      })}
    />
    <Section id="service" title={service.title} subtitle={service.short_description}>
      <div className="mb-8 flex flex-wrap gap-2">
        <Badge variant="price">{formatPrice(service)}</Badge>
        {service.duration_text ? <Badge variant="muted">Срок: {service.duration_text}</Badge> : null}
        {service.category_title ? <Badge variant="tech">{service.category_title}</Badge> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
          <h2 className="mb-3 text-base font-semibold">Что входит в стоимость</h2>
          <List items={service.included} tone="plus" />
        </div>
        <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
          <h2 className="mb-3 text-base font-semibold">Что не входит</h2>
          <List items={service.excluded} tone="minus" />
        </div>
        <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
          <h2 className="mb-3 text-base font-semibold">Что нужно от вас</h2>
          <List items={service.client_data} tone="plus" />
        </div>
        <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
          <h2 className="mb-3 text-base font-semibold">Возможные дополнительные расходы</h2>
          <List items={service.extra_costs} tone="minus" />
        </div>
      </div>

      {service.warranty_text ? (
        <p className="mt-6 text-sm text-[color:var(--c-text-muted)]">Гарантия: {service.warranty_text}</p>
      ) : null}

      <div className="mt-8 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
        <p className="text-sm text-[color:var(--c-text-muted)]">
          Указанная цена является стартовой. Итоговая стоимость определяется после анализа задачи и согласования технического задания.
        </p>
        <div className="mt-4">
          <ButtonLink href="/contacts/#lead">Обсудить задачу</ButtonLink>
        </div>
      </div>
    </Section>
    </>
  );
}