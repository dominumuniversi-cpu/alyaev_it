/** Контейнер секции. Манифест: docs/manifests/ui/section.md */

/** Секция с заголовком H2 и вложенным контентом. */
export function Section({
  id,
  title,
  subtitle,
  children,
  surface = false,
}: {
  id: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  surface?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={title ? id + "-title" : undefined}
      className={surface ? "bg-[color:var(--c-surface)]" : "bg-transparent"}
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {title ? (
          <header className="mb-10 max-w-3xl">
            <h2
              id={id + "-title"}
              className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"
            >
              {title}
            </h2>
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