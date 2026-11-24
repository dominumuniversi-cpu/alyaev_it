/** Контейнер секции. Манифест: docs/manifests/ui/section.md */

import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";

/** Секция с заголовком и вложенным контентом. */
export function Section({
  id,
  title,
  subtitle,
  children,
  surface = false,
  breadcrumbs,
  headingLevel = 2,
}: {
  id: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  surface?: boolean;
  /** Крошки для страниц второго уровня и глубже (манифест breadcrumbs.md). */
  breadcrumbs?: Crumb[];
  /**
   * Уровень заголовка. Первая (и единственная) секция страницы обязана
   * объявлять h1 — иначе у страницы нет главного заголовка (ТЗ 11.1).
   */
  headingLevel?: 1 | 2;
}) {
  /** Тег заголовка: h1 для главного заголовка страницы, h2 для остальных секций. */
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section
      id={id}
      aria-labelledby={title ? id + "-title" : undefined}
      className={surface ? "bg-[color:var(--c-surface)]" : "bg-transparent"}
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
        {title ? (
          <header className="mb-10 max-w-3xl">
            {Heading === "h1" ? (
              <h1
                id={id + "-title"}
                className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
              >
                {title}
              </h1>
            ) : (
              <h2
                id={id + "-title"}
                className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"
              >
                {title}
              </h2>
            )}
            {subtitle ? (
              <p className="mt-3 text-base leading-relaxed text-[color:var(--c-text-muted)]">{subtitle}</p>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}