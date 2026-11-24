/** Счётчики Яндекс Метрики и GA4. Манифест: docs/manifests/analytics.md */

"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const YM_ID = process.env.NEXT_PUBLIC_YM_ID ?? "";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

/** Разделы, куда счётчик ставить нельзя: там персональные данные. */
const PRIVATE_PREFIXES = ["/admin", "/login", "/account", "/register"];

/** Отправляет цель в оба счётчика, если они подключены. */
export function reachGoal(goal: string): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    ym?: (id: number, action: string, goal: string) => void;
    gtag?: (...args: unknown[]) => void;
  };
  if (YM_ID && typeof w.ym === "function") {
    const id = Number(YM_ID);
    if (!Number.isNaN(id)) w.ym(id, "reachGoal", goal);
  }
  if (GA_ID && typeof w.gtag === "function") {
    w.gtag("event", goal);
  }
}

/** Подключает счётчики, если заданы ID и страница не приватная. */
export function Analytics() {
  const pathname = usePathname() ?? "";
  // usePathname уже содержит basePath, поэтому проверяем вхождение, а не начало.
  const isPrivate = PRIVATE_PREFIXES.some((prefix) => pathname.includes(prefix));
  if (isPrivate) return null;

  return (
    <>
      {YM_ID ? (
        <Script id="ym-counter" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
ym(${JSON.stringify(YM_ID)},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false});`}
        </Script>
      ) : null}
      {GA_ID ? (
        <>
          <Script
            src={"https://www.googletagmanager.com/gtag/js?id=" + GA_ID}
            strategy="afterInteractive"
          />
          <Script id="ga-counter" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag("js",new Date());gtag("config",${JSON.stringify(GA_ID)});`}
          </Script>
        </>
      ) : null}
    </>
  );
}
