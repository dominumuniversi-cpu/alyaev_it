/** Шесть уникальных SVG-визуалов услуг (PERSONAL v2.0).
 *
 *  Правила системы: техническая инфографика вместо случайных AI-картинок,
 *  ни одна иллюстрация не повторяется между услугами, текст внутри картинки не рисуется.
 *  Цвета — только токены (var(--c-*)), размер задаётся классом.
 */

type VisualType = "telegram" | "ai" | "knowledge" | "automation" | "parser" | "integration";

/** Соответствие slug услуги из БД визуалу. Неизвестный slug — по категории. */
const BY_SLUG: Record<string, VisualType> = {
  "telegram-bot-for-business": "telegram",
  "ai-consultant-bot": "ai",
  "knowledge-base-bot": "knowledge",
  "bot-repair": "telegram",
  "service-link": "integration",
  "process-automation": "automation",
  "ai-digest": "ai",
  "site-parser": "parser",
  "api-integration": "integration",
  "1c-integration": "integration",
};

const BY_CATEGORY: Record<string, VisualType> = {
  "telegram-bots": "telegram",
  automation: "automation",
  parsers: "parser",
  integrations: "integration",
  websites: "integration",
};

/** Какой визуал показать для услуги. */
export function visualTypeFor(slug?: string | null, category?: string | null): VisualType {
  if (slug && BY_SLUG[slug]) return BY_SLUG[slug];
  if (category && BY_CATEGORY[category]) return BY_CATEGORY[category];
  return "integration";
}

/** Общие атрибуты штриха: графитовый контур, скруглённые концы. */
const STROKE = {
  fill: "none",
  stroke: "var(--c-ink)",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const LIME = "var(--c-lime)";
const TERRA = "var(--c-terracotta)";
const PAPER = "var(--c-paper)";

/** Рисунок для каждого типа: одна сцена, один смысл. */
function Art({ type }: { type: VisualType }) {
  if (type === "telegram") {
    return (
      <>
        <rect x="65" y="25" width="90" height="145" rx="17" fill="var(--c-ink)" />
        <rect x="73" y="37" width="74" height="120" rx="9" fill={PAPER} />
        <path d="M87 75h45M87 91h35" {...STROKE} />
        <rect x="87" y="108" width="42" height="20" rx="10" fill={LIME} />
        <path d="m107 56 16-7-8 18-4-6-4-5Z" fill={TERRA} />
        <circle cx="174" cy="48" r="17" fill={LIME} />
        <path d="m167 48 5 5 9-11" {...STROKE} />
      </>
    );
  }
  if (type === "ai") {
    return (
      <>
        <circle cx="112" cy="94" r="53" fill={LIME} />
        <circle cx="112" cy="94" r="35" {...STROKE} />
        <path d="M97 89h1m28 0h1M100 109q12 12 24 0" {...STROKE} />
        <path d="M112 29V14M112 174v-15M47 94H31M193 94h-16" {...STROKE} />
        <circle cx="112" cy="14" r="5" fill={TERRA} />
        <circle cx="193" cy="94" r="5" fill={TERRA} />
        <path d="M150 49 170 29M54 154l20-20" {...STROKE} />
      </>
    );
  }
  if (type === "knowledge") {
    return (
      <>
        <path d="M62 36h76l28 28v104H62Z" fill={PAPER} stroke="var(--c-ink)" strokeWidth="2" />
        <path d="M138 36v30h28" {...STROKE} />
        <path d="M81 86h65M81 101h55M81 116h47" {...STROKE} />
        <rect x="119" y="125" width="66" height="42" rx="8" fill={LIME} />
        <circle cx="143" cy="144" r="9" {...STROKE} />
        <path d="m150 151 9 9" {...STROKE} />
      </>
    );
  }
  if (type === "automation") {
    return (
      <>
        <rect x="30" y="76" width="54" height="44" rx="8" fill={PAPER} stroke="var(--c-ink)" strokeWidth="2" />
        <rect x="153" y="30" width="54" height="44" rx="8" fill={LIME} stroke="var(--c-ink)" strokeWidth="2" />
        <rect x="153" y="123" width="54" height="44" rx="8" fill={TERRA} stroke="var(--c-ink)" strokeWidth="2" />
        <path d="M84 98h34V52h35M118 98h35v47" {...STROKE} />
        <path d="m144 44 9 8-9 8M144 137l9 8-9 8" {...STROKE} />
        <circle cx="118" cy="98" r="7" fill="var(--c-ink)" />
      </>
    );
  }
  if (type === "parser") {
    return (
      <>
        <path d="M48 48h75l18 18v92H48Z" fill={PAPER} stroke="var(--c-ink)" strokeWidth="2" />
        <path d="M123 48v20h18M65 88h56M65 104h46M65 120h36" {...STROKE} />
        <rect x="157" y="78" width="38" height="68" rx="6" fill={LIME} stroke="var(--c-ink)" strokeWidth="2" />
        <path d="M157 96h38M157 110h38M157 124h38" {...STROKE} />
        <circle cx="176" cy="162" r="14" fill={TERRA} />
        <path d="m170 162 4 4 8-9" {...STROKE} />
      </>
    );
  }
  return (
    <>
      <circle cx="45" cy="60" r="17" fill={LIME} stroke="var(--c-ink)" strokeWidth="2" />
      <circle cx="45" cy="148" r="17" fill={TERRA} stroke="var(--c-ink)" strokeWidth="2" />
      <circle cx="185" cy="104" r="21" fill="var(--c-ink)" />
      <path d="M62 60h40l22 44M62 148h40l22-44" {...STROKE} />
      <path d="M164 104h-38" {...STROKE} />
      <path d="M60 96v16M52 104h16" {...STROKE} />
    </>
  );
}

/** Сцена услуги. Декоративная: смысл несут заголовок и описание карточки. */
export function PersonalServiceVisual({ type, className }: { type: VisualType; className?: string }) {
  return (
    <svg
      viewBox="0 0 230 200"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <Art type={type} />
    </svg>
  );
}
