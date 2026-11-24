/** Кнопка и ссылка-кнопка. Манифест: docs/manifests/ui/button.md */

import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-150 no-underline";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[color:var(--c-gold)] text-[#0A0C12] hover:bg-[#EFCF98] border border-transparent",
  secondary:
    "bg-transparent text-[color:var(--c-text)] border border-[color:var(--c-border-strong)] hover:border-[color:var(--c-gold)] hover:text-[color:var(--c-gold)]",
  ghost: "bg-transparent text-[color:var(--c-cyan)] border border-transparent hover:underline",
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