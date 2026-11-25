/** Оболочка страницы входа: без публичной шапки. */

import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Пропускает содержимое без шапки сайта. */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[color:var(--c-paper)]">{children}</div>;
}
