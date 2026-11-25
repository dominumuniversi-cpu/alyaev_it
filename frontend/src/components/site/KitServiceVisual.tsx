/** Иллюстрации направлений из пакета PERSONAL v2.0 (ServiceVisual.tsx).
 *  Геометрия пакета сохранена один в один; цвета переведены на роли темы,
 *  поэтому схемы работают и на бумаге, и в тёмной теме. */

import type { ReactNode } from "react";

export type KitServiceType =
  | "telegram"
  | "ai"
  | "knowledge"
  | "automation"
  | "parser"
  | "integration";

const COMMON = {
  fill: "none",
  stroke: "var(--c-ink)",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** схемы пакета: по одной на направление */
const ART: Record<KitServiceType, ReactNode> = {
    telegram: <><rect x="65" y="25" width="90" height="145" rx="17" fill="var(--c-ink)"/><rect x="73" y="37" width="74" height="120" rx="9" fill="var(--c-paper)"/><path d="M87 75h45M87 91h35" {...COMMON}/><rect x="87" y="108" width="42" height="20" rx="10" fill="--c-lime"/><path d="m107 56 16-7-8 18-4-6-4-5Z" fill="--c-terracotta"/><circle cx="174" cy="48" r="17" fill="--c-lime"/><path d="m167 48 5 5 9-11" {...COMMON}/></>,
    ai: <><circle cx="112" cy="94" r="53" fill="--c-lime"/><circle cx="112" cy="94" r="35" {...COMMON}/><path d="M97 89h1m28 0h1M100 109q12 12 24 0" {...COMMON}/><path d="M112 29V14M112 174v-15M47 94H31M193 94h-16" {...COMMON}/><circle cx="112" cy="14" r="5" fill="--c-terracotta"/><circle cx="193" cy="94" r="5" fill="--c-terracotta"/><path d="M150 49 170 29M54 154l20-20" {...COMMON}/></>,
    knowledge: <><path d="M62 36h76l28 28v104H62Z" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2"/><path d="M138 36v30h28" {...COMMON}/><path d="M81 86h65M81 101h55M81 116h47" {...COMMON}/><rect x="119" y="125" width="66" height="42" rx="8" fill="--c-lime"/><circle cx="143" cy="144" r="9" {...COMMON}/><path d="m150 151 9 9" {...COMMON}/></>,
    automation: <><rect x="30" y="76" width="54" height="44" rx="8" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2"/><rect x="153" y="30" width="54" height="44" rx="8" fill="--c-lime" stroke="var(--c-ink)" strokeWidth="2"/><rect x="153" y="123" width="54" height="44" rx="8" fill="--c-terracotta" stroke="var(--c-ink)" strokeWidth="2"/><path d="M84 98h34V52h35M118 98h35v47" {...COMMON}/><path d="m144 44 9 8-9 8M144 137l9 8-9 8" {...COMMON}/><circle cx="118" cy="98" r="7" fill="var(--c-ink)"/></>,
    parser: <><path d="M48 48h75l18 18v92H48Z" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2"/><path d="M123 48v20h18M65 88h56M65 104h46M65 120h36" {...COMMON}/><path d="M157 78h38v68h-38Z" fill="--c-lime" stroke="var(--c-ink)" strokeWidth="2"/><path d="M166 96h20M166 108h20M166 120h14" {...COMMON}/><path d="M141 111h16" stroke="--c-terracotta" strokeWidth="3" strokeLinecap="round"/></>,
    integration: <><circle cx="112" cy="96" r="28" fill="--c-lime" stroke="var(--c-ink)" strokeWidth="2"/><rect x="24" y="38" width="42" height="42" rx="9" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2"/><rect x="158" y="38" width="42" height="42" rx="9" fill="--c-terracotta" stroke="var(--c-ink)" strokeWidth="2"/><rect x="24" y="132" width="42" height="42" rx="9" fill="--c-terracotta" stroke="var(--c-ink)" strokeWidth="2"/><rect x="158" y="132" width="42" height="42" rx="9" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2"/><path d="m66 59 25 22M158 59l-25 22M66 153l25-36M158 153l-25-36" {...COMMON}/><path d="M103 96h18M112 87v18" {...COMMON}/></>
};

/** Схема направления из пакета: одна и та же геометрия на сайте и в макете. */
export function KitServiceVisual({ type }: { type: KitServiceType }) {
  return (
    <svg viewBox="0 0 230 200" role="img" aria-label="Схема направления услуг" className="h-full w-full">
      {ART[type]}
    </svg>
  );
}
