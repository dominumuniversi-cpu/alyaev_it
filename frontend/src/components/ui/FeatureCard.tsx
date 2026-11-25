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
    <div className="h-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
      {marker ? (
        <p
          className={
            "mb-3 font-[family-name:var(--font-display)] text-2xl font-bold " +
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
      <h3 className="mb-2 text-base font-semibold leading-snug">{title}</h3>
      <p className="text-sm leading-relaxed text-[color:var(--c-text-muted)]">{text}</p>
    </div>
  );
}