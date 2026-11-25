/** Декоративная подложка секции. Манифест: docs/manifests/ui/images.md */

import { decorativeBackground, type DecorativeBackgroundName } from "@/lib/design/images";

export interface SectionBackdropProps {
  /** Какой фон из реестра брать. */
  name: DecorativeBackgroundName;
  /** Классы позиционирования, размера и прозрачности (опционально). */
  className?: string;
}

/**
 * Декоративный фон секции: CSS-подложка, не картинка в разметке.
 * Всегда aria-hidden и не перехватывает клики; прозрачность задаётся классом.
 */
export const BACKDROP_CLASS = "pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat";

export function SectionBackdrop({ name, className }: SectionBackdropProps) {
  const style = { backgroundImage: decorativeBackground(name) };
  return <div aria-hidden="true" className={BACKDROP_CLASS + " " + (className ?? "")} style={style} />;
}
