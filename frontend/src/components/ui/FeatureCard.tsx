/** Карточка тезиса. Манифест: docs/manifests/ui/feature-card.md */

import { Icon, type IconName } from "@/components/ui/Icon";

/** Тезис с номером или иконкой: преимущества и этапы. */
export function FeatureCard({
  title,
  text,
  marker,
  icon,
  tone = "gold",
}: {
  title: string;
  text: string;
  marker?: string;
  /** Пиктограмма сверху карточки (см. Icon). */
  icon?: IconName;
  tone?: "gold" | "cyan";
}) {
  return (
    <div className="h-full border-t-2 border-[color:var(--c-ink)] bg-[color:var(--c-paper-2)] p-6">
      {marker ? (
        <p
          className={
            "mb-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] " +
            (tone === "gold" ? "text-[color:var(--c-gold)]" : "text-[color:var(--c-cyan)]")
          }
        >
          {marker}
        </p>
      ) : null}
      {icon ? (
        <Icon
          name={icon}
          className={
            "mb-3 h-7 w-7 " + (tone === "gold" ? "text-[color:var(--c-gold)]" : "text-[color:var(--c-cyan)]")
          }
        />
      ) : null}
      <h3 className="mb-2 font-[family-name:var(--font-display)] text-base font-bold uppercase leading-snug tracking-[-0.01em] text-[color:var(--c-ink)]">{title}</h3>
      <p className="text-sm leading-relaxed text-[color:var(--c-text-muted)]">{text}</p>
    </div>
  );
}