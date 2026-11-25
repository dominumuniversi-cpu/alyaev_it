/** Контейнер секции. Манифест: docs/manifests/ui/section.md */

import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { DISPLAY_H1, DISPLAY_H2 } from "@/lib/design/ui";

/** Секция с заголовком и вложенным контентом. */
export function Section({
  id,
  title,
  subtitle,
  children,
  surface = false,
  flat = false,
  breadcrumbs,
  headingLevel = 2,
}: {
  id: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Тёмная секция (графит): внутри неё роли токенов переключаются классом .on-dark. */
  surface?: boolean;
  /** Первая секция страницы: верхний отступ срезан, чтобы под шапкой не висела пустая полоса. */
  flat?: boolean;
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
      className={"relative overflow-hidden " + (surface ? "on-dark" : "bg-transparent")}
      style={flat ? { paddingTop: "calc(var(--space-section) * 0.55)", paddingBottom: "var(--space-section)" } : { paddingBlock: "var(--space-section)" }}
    >
      <div className="relative mx-auto w-full max-w-[var(--shell-max)] px-[var(--shell-gutter)]">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
        {title ? (
          <header className="mb-10 max-w-[min(100%,74ch)]">
            {Heading === "h1" ? (
              <h1
                id={id + "-title"}
                className={DISPLAY_H1}
              >
                {title}
              </h1>
            ) : (
              <h2
                id={id + "-title"}
                className={DISPLAY_H2}
              >
                {title}
              </h2>
            )}
            {subtitle ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--c-muted)]">{subtitle}</p>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}
