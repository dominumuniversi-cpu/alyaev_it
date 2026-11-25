/** Подвал сайта. Манифест: docs/manifests/ui/footer.md */

import Link from "next/link";

const SECTIONS = [
  { href: "/services/", label: "Услуги" },
  { href: "/portfolio/", label: "Портфолио" },
  { href: "/about/", label: "Обо мне" },
  { href: "/blog/", label: "Блог" },
  { href: "/calculator/", label: "Калькулятор" },
    { href: "/diagnostics/", label: "Разбор процесса" },
  { href: "/contacts/", label: "Контакты" },
];

const DOCS = [
  { href: "/privacy/", label: "Политика конфиденциальности" },
  { href: "/personal-data-consent/", label: "Согласие на обработку данных" },
];

/** Подвал: бренд, разделы, документы, контакты и копирайт. */
export function Footer({
  services,
  contacts,
}: {
  services: { slug: string; title: string }[];
  contacts: Record<string, string>;
}) {
  const year = new Date().getFullYear();
  const telegram = contacts.telegram ?? "";
  const email = contacts.email ?? "";

  return (
    <footer className="border-t border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] text-[color:var(--c-ink)]">
      <div className="mx-auto w-full max-w-[var(--shell-max)] px-[var(--shell-gutter)] py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold">
              Дмитрий <span className="text-[color:var(--c-terra-ink)]">Аляев</span>
            </p>
            <p className="mt-2 text-sm text-[color:var(--c-muted)]">AI & Business Automation</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[color:var(--c-muted)]">
              Автоматизация бизнеса, AI-разработка и интеграция информационных систем.
            </p>
          </div>

          <nav aria-label="Разделы сайта">
            <p className="mb-3 text-xs uppercase tracking-widest text-[color:var(--c-muted)]">Разделы</p>
            <ul className="space-y-2 text-sm">
              {SECTIONS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="no-underline hover:text-[color:var(--c-terra-ink)]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Услуги">
            <p className="mb-3 text-xs uppercase tracking-widest text-[color:var(--c-muted)]">Услуги</p>
            <ul className="space-y-2 text-sm">
              {services.slice(0, 6).map((service) => (
                <li key={service.slug}>
                  <Link
                    href={"/services/" + service.slug + "/"}
                    className="no-underline hover:text-[color:var(--c-terra-ink)]"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-[color:var(--c-muted)]">Документы</p>
            <ul className="space-y-2 text-sm">
              {DOCS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="no-underline hover:text-[color:var(--c-terra-ink)]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            {(telegram || email) ? (
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--c-muted)]">
                {telegram ? (
                  <li>
                    Telegram:{" "}
                    <a
                      href={contacts.telegram_url || "https://t.me/" + telegram.replace(/^@/, "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[color:var(--c-terra-ink)] no-underline hover:underline"
                    >
                      {telegram}
                    </a>
                  </li>
                ) : null}
                {email ? <li>E-mail: {email}</li> : null}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[color:var(--c-line)] pt-6 text-sm text-[color:var(--c-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Дмитрий Аляев</p>
          <Link href="/login/" className="no-underline hover:text-[color:var(--c-terra-ink)]">
            Вход для клиентов
          </Link>
        </div>
      </div>
    </footer>
  );
}