/** Метка статуса/цены/технологии. Манифест: docs/manifests/ui/badge.md */

type Variant = "tech" | "price" | "muted" | "status";

const STYLES: Record<Variant, string> = {
  tech: "text-[color:var(--c-cyan)] border-[color:rgba(34,184,230,.35)] bg-[rgba(34,184,230,.08)]",
  price: "text-[color:var(--c-gold)] border-[color:rgba(227,188,122,.35)] bg-[rgba(227,188,122,.1)]",
  muted: "text-[color:var(--c-text-muted)] border-[color:var(--c-border)] bg-transparent",
  status: "text-[color:var(--c-text)] border-[color:var(--c-border-strong)] bg-[color:var(--c-surface-2)]",
};

/** Компактная метка: текст до 24 символов, не кликабельна. */
export function Badge({ children, variant = "muted" }: { children: React.ReactNode; variant?: Variant }) {
  return (
    <span
      className={
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium " +
        STYLES[variant]
      }
    >
      {children}
    </span>
  );
}