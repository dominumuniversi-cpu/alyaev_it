/** Иконки интерфейса. Манифест: docs/manifests/ui/icons.md */

export type IconName =
  | "shield" | "handshake" | "headset" | "bolt" | "cloud-up"
  | "robot" | "gear" | "globe" | "monitor" | "chat" | "chart";

export interface IconProps {
  name: IconName;
  className?: string;
}

const PATHS: Record<IconName, string> = {
  shield: "M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3z M9 12l2 2 4-4",
  handshake: "M3 12l4-4 3 3 3-3 4 4 M7 8l3 3-2 2 4 4 2-2 4 4",
  headset: "M4 14v-2a8 8 0 0116 0v2 M4 14a2 2 0 002 2h1v-4H6a2 2 0 00-2 2z M20 14a2 2 0 01-2 2h-1v-4h1a2 2 0 012 2z",
  bolt: "M13 2L4 14h6l-1 8 9-12h-6l1-8z",
  "cloud-up": "M7 18a4 4 0 010-8 5.5 5.5 0 0110.5 1.5A3.5 3.5 0 0117 18H7z M12 15v-5 M9.5 12.5L12 10l2.5 2.5",
  robot: "M9 3h6v3H9z M5 6h14a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z M9 11v2 M15 11v2 M9 16h6",
  gear: "M12 8a4 4 0 100 8 4 4 0 000-8z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M19.1 4.9L17 7 M7 17l-2.1 2.1",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18z M3 12h18 M12 3c3 3.5 3 14.5 0 18 M12 3c-3 3.5-3 14.5 0 18",
  monitor: "M3 5h18v11H3z M9 20h6 M12 16v4",
  chat: "M4 5h16v11H9l-5 4V5z M8 9h8 M8 12h5",
  chart: "M4 20V4 M4 20h16 M8 16v-5 M13 16V8 M18 16v-3",
};

/**
 * Пиктограмма: тонкий штрих, цвет берётся из текущего текста (currentColor),
 * размер — через className, поэтому иконка масштабируется без потерь.
 */
export function Icon({ name, className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
