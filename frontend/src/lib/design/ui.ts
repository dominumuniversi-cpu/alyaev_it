/**
 * Единый источник повторяющихся деталей интерфейса.
 *
 * Зачем: правка «одной детали» должна применяться по всему сайту из одного места.
 * Правило владельца: меняешь отступ/высоту/радиус кнопки — правишь ТОЛЬКО этот файл,
 * а не двадцать компонентов. Манифест: docs/manifests/ui/ui-conventions.md.
 *
 * Тут только скелет разметки (размеры, отступы, состояния). Цвета берутся из токенов
 * globals.css — сырые HEX в этом файле запрещены так же, как в компонентах.
 */

/** Скелет кнопки: общая форма для всех вариантов, меняются только классы цвета. */
export const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-pill border border-transparent font-semibold no-underline transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2";

/** Высота и горизонтальные отступы кнопки по размеру. */
export const BUTTON_SIZES = {
  md: "min-h-[44px] px-5 text-[13px]",
  lg: "min-h-[52px] px-7 text-sm",
} as const;

export type ButtonSize = keyof typeof BUTTON_SIZES;

/** Карточка-поверхность: рамка, фон и радиус из темы. Используется везде, где нужна плашка. */
export const SURFACE_CARD =
  "border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] rounded-[var(--radius-md)]";

/** Техническая подпись (eyebrow): моно-шрифт, капс, разреженный трекинг. */
export const EYEBROW =
  "font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em]";

/** Заголовок первого уровня: крупная display-типографика на всю ширину. */
export const DISPLAY_H1 =
  "font-[family-name:var(--font-display)] text-[clamp(38px,7vw,92px)] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[color:var(--c-ink)]";

/** Заголовок секции. */
export const DISPLAY_H2 =
  "font-[family-name:var(--font-display)] text-[clamp(26px,3.6vw,44px)] font-bold uppercase leading-[1] tracking-[-0.02em] text-[color:var(--c-text)]";

/** Вертикальный ритм секции: один шаг на весь сайт. */
export const SECTION_SPACE = "py-[var(--space-section)]";

