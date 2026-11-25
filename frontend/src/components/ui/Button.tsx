/** Кнопка и ссылка-кнопка. Манифест: docs/manifests/ui/button.md (PERSONAL v2.0).
 *
 * Размер, отступы и форма кнопки живут в src/lib/design/ui.ts (BUTTON_BASE / BUTTON_SIZES).
 * Меняешь высоту или отступ кнопки на всём сайте — правишь ТОЛЬКО там.
 */

import Link from "next/link";

import { BUTTON_BASE, BUTTON_SIZES, type ButtonSize } from "@/lib/design/ui";

type Variant = "primary" | "secondary" | "ghost";
type Size = ButtonSize;

/** Варианты различаются только цветом и состоянием наведения. */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-[color:var(--c-lime)] text-[color:var(--c-ink)] hover:bg-[color:var(--c-gold-dim)]",
  secondary:
    "border-[color:var(--c-border-strong)] bg-transparent text-[color:var(--c-text)] hover:bg-[color:var(--c-ink)] hover:text-[color:var(--c-paper)]",
  ghost: "bg-transparent text-[color:var(--c-ink)] underline-offset-4 hover:underline",
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
    <Link href={href} className={[BUTTON_BASE, VARIANTS[variant], BUTTON_SIZES[size], className].join(" ")}>
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
    <button className={[BUTTON_BASE, VARIANTS[variant], BUTTON_SIZES[size], className].join(" ")} {...rest}>
      {children}
    </button>
  );
}
