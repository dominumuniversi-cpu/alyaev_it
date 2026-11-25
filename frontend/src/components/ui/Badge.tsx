/** Метка статуса/цены/технологии. Манифест: docs/manifests/ui/badge.md */

type Variant = "tech" | "price" | "muted" | "status";

const STYLES: Record<Variant, string> = {
  tech: "text-[color:var(--c-ink)] border-[color:var(--c-line-2)] bg-[color:var(--c-lime)]",
  price: "text-[color:var(--c-ink)] border-[color:var(--c-terracotta)] bg-transparent font-semibold",
  muted: "text-[color:var(--c-muted)] border-[color:var(--c-line)] bg-transparent",
  status: "text-[color:var(--c-ink)] border-[color:var(--c-line-2)] on-dark:bg-[color:var(--c-ink)] bg-[color:var(--c-paper)]",
};

/** Компактная метка: текст до 24 символов, не кликабельна. */
export function Badge({ children, variant = "muted" }: { children: React.ReactNode; variant?: Variant }) {
  return (
    <span
      className={
        "inline-flex items-center whitespace-nowrap border px-2.5 py-0.5 text-xs font-medium " +
        STYLES[variant]
      }
    >
      {children}
    </span>
  );
}