/** Навигация по разделам админки. Манифест: docs/manifests/ui/admin-layout.md */

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/alyaev";

type Section = { href: string; label: string };

/** Разделы админки в порядке важности для администратора. */
const SECTIONS: Section[] = [
  { href: "/admin/", label: "Заявки" },
  { href: "/admin/clients/", label: "Клиенты" },
  { href: "/admin/projects/", label: "Проекты" },
  { href: "/admin/services/", label: "Услуги и цены" },
  { href: "/admin/portfolio/", label: "Портфолио" },
  { href: "/admin/articles/", label: "Блог" },
  { href: "/admin/reviews/", label: "Отзывы" },
  { href: "/admin/semantic/", label: "Семантика" },
  { href: "/admin/seo/", label: "SEO" },
  { href: "/admin/audit/", label: "Журнал" },
];

/** Горизонтальное меню разделов. Текущий раздел выделен. */
export function AdminNav({ current }: { current: string }) {
  return (
    <nav aria-label="Разделы админки" className="mb-6 flex flex-wrap gap-2">
      {SECTIONS.map((s) => {
        const active = s.href === current;
        return (
          <a
            key={s.href}
            href={BASE_PATH + s.href}
            aria-current={active ? "page" : undefined}
            className={
              "rounded-[var(--radius-md)] border px-4 py-2 text-sm font-medium no-underline transition-colors " +
              (active
                ? "border-[color:var(--c-lime-ink)] bg-[color:var(--c-paper)] text-[color:var(--c-lime-ink)]"
                : "border-[color:var(--c-line)] text-[color:var(--c-muted)] hover:border-[color:var(--c-line-2)] hover:text-[color:var(--c-ink)]")
            }
          >
            {s.label}
          </a>
        );
      })}
    </nav>
  );
}
