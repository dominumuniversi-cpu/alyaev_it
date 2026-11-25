/** Технические схемы портфолио. Манифест: docs/manifests/ui/portfolio.md (PERSONAL v2.0).
 *
 * У каждого проекта свой сюжет: диалог с ботом, поиск по документам, конвейер заявок,
 * извлечение данных, обмен с 1С, дайджест. Только токены темы, без сырых HEX.
 * SVG декоративна: смысл дублирует подпись рядом, поэтому aria-hidden.
 */

import type { PortfolioVisual as Visual } from "@/lib/design/portfolio";

/** Общая рамка схемы: 320×200, бумажный фон, лёгкая сетка. */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 200" role="presentation" aria-hidden="true" className="h-auto w-full">
      <rect width="320" height="200" fill="var(--c-paper-2)" />
      <g stroke="var(--c-line)" strokeWidth="1" opacity="0.55">
        <path d="M0 50h320M0 100h320M0 150h320M80 0v200M160 0v200M240 0v200" />
      </g>
      {children}
    </svg>
  );
}

/** Диалог с ботом и передача сложного вопроса менеджеру. */
function DialogScene() {
  return (
    <g>
      <rect x="34" y="26" width="152" height="148" rx="16" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
      <rect x="52" y="46" width="86" height="12" rx="6" fill="var(--c-line)" />
      <rect x="52" y="68" width="116" height="12" rx="6" fill="var(--c-lime)" />
      <rect x="52" y="90" width="82" height="12" rx="6" fill="var(--c-line)" />
      <rect x="52" y="140" width="116" height="20" rx="10" fill="var(--c-paper-2)" stroke="var(--c-ink)" strokeWidth="1.5" />
      <circle cx="222" cy="64" r="24" fill="var(--c-terracotta)" />
      <path d="M212 64h20M222 54v20" stroke="var(--c-paper)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M186 96h24" stroke="var(--c-ink)" strokeWidth="2" strokeLinecap="round" />
      <path d="M204 92l6 4-6 4" fill="none" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
      <rect x="230" y="104" width="64" height="52" rx="8" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
      <path d="M240 120h44M240 132h30" stroke="var(--c-line-2)" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

/** Поиск по документам: документы, индекс и ответ со ссылкой на источник. */
function SearchScene() {
  return (
    <g>
      <rect x="24" y="30" width="76" height="96" rx="6" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
      <rect x="36" y="46" width="52" height="6" rx="3" fill="var(--c-line-2)" />
      <rect x="36" y="60" width="42" height="6" rx="3" fill="var(--c-line-2)" />
      <rect x="36" y="74" width="48" height="6" rx="3" fill="var(--c-lime)" />
      <rect x="112" y="30" width="76" height="96" rx="6" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
      <rect x="124" y="46" width="52" height="6" rx="3" fill="var(--c-line-2)" />
      <rect x="124" y="60" width="36" height="6" rx="3" fill="var(--c-line-2)" />
      <circle cx="232" cy="78" r="30" fill="none" stroke="var(--c-terracotta)" strokeWidth="3" />
      <path d="M254 100l22 22" stroke="var(--c-terracotta)" strokeWidth="3" strokeLinecap="round" />
      <rect x="196" y="132" width="96" height="34" rx="6" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
      <path d="M208 146h60M208 156h38" stroke="var(--c-line-2)" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

/** Конвейер заявок: канал, обработка, база, уведомление. */
function PipelineScene() {
  return (
    <g>
      <rect x="22" y="60" width="58" height="80" rx="8" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
      <path d="M38 82h26M38 96h18" stroke="var(--c-line-2)" strokeWidth="3" strokeLinecap="round" />
      <path d="M84 100h28" stroke="var(--c-ink)" strokeWidth="2" />
      <path d="M106 96l6 4-6 4" fill="none" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
      <rect x="116" y="46" width="88" height="108" rx="10" fill="var(--c-paper-2)" stroke="var(--c-ink)" strokeWidth="2" />
      <rect x="130" y="62" width="60" height="9" rx="4.5" fill="var(--c-lime)" />
      <rect x="130" y="80" width="44" height="9" rx="4.5" fill="var(--c-line-2)" />
      <rect x="130" y="98" width="52" height="9" rx="4.5" fill="var(--c-line-2)" />
      <rect x="130" y="124" width="60" height="16" rx="8" fill="var(--c-terracotta)" />
      <path d="M208 100h28" stroke="var(--c-ink)" strokeWidth="2" />
      <path d="M230 96l6 4-6 4" fill="none" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
      <rect x="240" y="66" width="58" height="68" rx="8" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
      <path d="M252 88h34M252 102h22M252 116h30" stroke="var(--c-line-2)" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

/** Извлечение данных: сайт, нормализация, таблица. */
function ExtractScene() {
  return (
    <g>
      <rect x="28" y="34" width="120" height="128" rx="8" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
      <path d="M28 52h120" stroke="var(--c-ink)" strokeWidth="2" />
      <circle cx="40" cy="43" r="3" fill="var(--c-terracotta)" />
      <circle cx="52" cy="43" r="3" fill="var(--c-line-2)" />
      <circle cx="64" cy="43" r="3" fill="var(--c-line-2)" />
      <path d="M42 74h92M42 92h64M42 110h84M42 128h56" stroke="var(--c-line-2)" strokeWidth="4" strokeLinecap="round" />
      <path d="M156 98h26" stroke="var(--c-ink)" strokeWidth="2" />
      <path d="M176 94l6 4-6 4" fill="none" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
      <rect x="190" y="44" width="104" height="108" rx="6" fill="var(--c-paper-2)" stroke="var(--c-ink)" strokeWidth="2" />
      <path d="M190 70h104M190 96h104M190 122h104M226 44v108M260 44v108" stroke="var(--c-ink)" strokeWidth="1.5" />
      <path d="M200 58h18M236 58h14M270 58h14M200 84h18M236 84h14M270 84h14" stroke="var(--c-lime)" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

/** Обмен с 1С: две системы, проверка и очередь повторных попыток. */
function SyncScene() {
  return (
    <g>
      <rect x="24" y="56" width="88" height="88" rx="10" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
      <path d="M44 84h48M44 100h32M44 116h40" stroke="var(--c-line-2)" strokeWidth="4" strokeLinecap="round" />
      <path d="M124 86h72" stroke="var(--c-ink)" strokeWidth="2" />
      <path d="M118 82l-6 4 6 4" fill="none" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M190 114h-72" stroke="var(--c-ink)" strokeWidth="2" />
      <path d="M196 110l6 4-6 4" fill="none" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
      <rect x="208" y="56" width="88" height="88" rx="10" fill="var(--c-paper-2)" stroke="var(--c-ink)" strokeWidth="2" />
      <path d="M228 84h48M228 100h30M228 116h44" stroke="var(--c-line-2)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="160" cy="100" r="14" fill="var(--c-lime)" />
      <path d="M154 100l4 4 8-8" fill="none" stroke="var(--c-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="112" y="146" width="96" height="28" rx="6" fill="var(--c-paper)" stroke="var(--c-terracotta)" strokeWidth="2" />
      <path d="M124 160h22" stroke="var(--c-terracotta)" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

/** Дайджест: много источников, сводка и отметка о доставке. */
function DigestScene() {
  return (
    <g>
      <rect x="26" y="30" width="96" height="34" rx="6" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="1.5" />
      <rect x="26" y="76" width="96" height="34" rx="6" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="1.5" />
      <rect x="26" y="122" width="96" height="34" rx="6" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="1.5" />
      <path d="M38 47h60M38 93h44M38 139h52" stroke="var(--c-line-2)" strokeWidth="4" strokeLinecap="round" />
      <path d="M124 47h24v76h-24" fill="none" stroke="var(--c-ink)" strokeWidth="2" />
      <rect x="160" y="44" width="132" height="112" rx="10" fill="var(--c-paper-2)" stroke="var(--c-ink)" strokeWidth="2" />
      <rect x="174" y="60" width="104" height="10" rx="5" fill="var(--c-lime)" />
      <rect x="174" y="80" width="78" height="8" rx="4" fill="var(--c-line-2)" />
      <rect x="174" y="96" width="92" height="8" rx="4" fill="var(--c-line-2)" />
      <circle cx="266" cy="132" r="12" fill="var(--c-terracotta)" />
      <path d="M260 132l4 4 8-8" fill="none" stroke="var(--c-paper)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/** Общая схема для новых кейсов из админки. */
function GenericScene() {
  return (
    <g>
      <circle cx="160" cy="100" r="34" fill="var(--c-lime)" />
      <circle cx="160" cy="100" r="14" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
      <circle cx="78" cy="58" r="16" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
      <circle cx="78" cy="142" r="16" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
      <circle cx="242" cy="100" r="16" fill="var(--c-terracotta)" />
      <path d="M94 64l34 22M94 136l34-22M194 100h32" stroke="var(--c-ink)" strokeWidth="2" />
    </g>
  );
}

/** Схема решения по типу проекта. */
export function PortfolioVisual({ type }: { type: Visual }) {
  const scene = (() => {
    switch (type) {
      case "dialog":
        return <DialogScene />;
      case "search":
        return <SearchScene />;
      case "pipeline":
        return <PipelineScene />;
      case "extract":
        return <ExtractScene />;
      case "sync":
        return <SyncScene />;
      case "digest":
        return <DigestScene />;
      default:
        return <GenericScene />;
    }
  })();
  return <Frame>{scene}</Frame>;
}
