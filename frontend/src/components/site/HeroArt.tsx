/** Сцена hero из пакета темы (p-hero-art). Манифест: docs/manifests/ui/kit-coverage.md.
 *
 * Техническая инфографика вместо иллюстрации: сетка модулей, орбита и «ядро» системы,
 * плюс машинная подпись о статусе. Всё на токенах темы, без растровых картинок.
 * Сцена декоративная: смысл несут заголовок и текст hero, поэтому aria-hidden.
 */

export function HeroArt() {
  return (
    <div aria-hidden="true" className="relative hidden min-h-[330px] overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--c-ink)] bg-[color:var(--c-ink)] p-6 text-[color:var(--c-paper)] shadow-[var(--shadow-paper)] lg:flex lg:items-end">
      {/* Сетка модулей с растворяющимся краем */}
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(234,231,223,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(234,231,223,.18)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:linear-gradient(135deg,#000,transparent_80%)]" />

      {/* Орбитальное кольцо */}
      <div className="pointer-events-none absolute -right-[3%] top-[25%] h-[150px] w-[320px] rotate-[-28deg] rounded-[50%] border border-[rgba(234,231,223,.45)]" />

      {/* «Ядро» системы: лаймовый шар с мягким свечением */}
      <div className="pointer-events-none absolute right-[8%] top-[12%] aspect-square w-[210px] rounded-full [background:radial-gradient(circle_at_35%_30%,var(--c-lime),#789C36_40%,#3E4D2C_70%,transparent_72%)] [filter:drop-shadow(0_0_50px_rgba(185,229,107,.25))]" />

      {/* Машинная подпись */}
      <p className="relative z-[1] font-[family-name:var(--font-mono)] text-[11px] leading-[1.8] text-[color:var(--c-paper)]">
        INPUT → LOGIC → AUTOMATION
        <br />
        DATA / AI / INTEGRATION
        <br />
        <span className="text-[color:var(--c-lime)]">
          SYSTEM STATUS: READY
        </span>
      </p>
    </div>
  );
}
