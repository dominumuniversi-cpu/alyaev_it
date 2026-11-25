/** Кнопка и ссылка-кнопка. Манифест: docs/manifests/ui/button.md (PERSONAL v2.0) */

import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

/** База: прямоугольная кнопка, крупная типографика, без «пилюли». */
const BASE = "inline-flex items-center justify-center gap-2 border border-transparent font-semibold no-underline transition-colors duration-150";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[color:var(--c-lime)] text-[color:var(--c-ink)] hover:bg-[color:var(--c-gold-dim)]",
  secondary:
    "border-[color:var(--c-border-strong)] bg-transparent text-[color:var(--c-text)] hover:bg-[color:var(--c-ink)] hover:text-[color:var(--c-paper)]",
  ghost:
    "bg-transparent text-[color:var(--c-ink)] underline-offset-4 hover:underline",
};

const SIZES: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

/** Ссылка, оформленная как кнопка: навигация без перезагрузки. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return (
    <Link href={href} className={[BASE, VARIANTS[variant], SIZES[size], className].join(" ")}>
      {children}
    </Link>
  );
}

/** Кнопка действия. type=submit по умолчанию. */
export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={[BASE, VARIANTS[variant], SIZES[size], className].join(" ")} {...rest}>
      {children}
    </button>
  );
}
