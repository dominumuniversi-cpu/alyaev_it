/** Обработка удалённых страниц (410) и смены адресов (301). ТЗ 11.5.
 *
 *  Редиректы и «мёртвые» адреса держим в одном месте, а не размазываем по страницам:
 *  иначе через месяц никто не вспомнит, где какой адрес переехал.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASE_PATH = process.env.BASE_PATH ?? "/alyaev";

/** Имя cookie темы. Читается здесь и на клиенте (переключатель в шапке). */
const THEME_COOKIE = "theme";

/** Класс темы для <html>: тёмная по cookie "dark", иначе светлая. */
function themeClass(cookieValue: string | undefined): "dark" | "light" {
  return cookieValue === "dark" ? "dark" : "light";
}

/** Постоянные редиректы: старый путь → новый. Срабатывают на 301. */
const REDIRECTS: Record<string, string> = {
  "/consent/": "/personal-data-consent/",
};

/** Адреса, которые существовали и были удалены осознанно: 410 вместо 404.
 *  410 говорит поисковику «убирай из индекса», 404 оставляет сомнение. */
const GONE: string[] = [
  // Адреса, которые были и удалены осознанно: 410 вместо 404.
  // Пример добавления: "/services/old-service/", — когда услуга снята с публикации.
];

/** Нормализует путь: убирает префикс и хвостовой слеш для сравнения. */
function normalize(pathname: string): string {
  let path = pathname;
  if (BASE_PATH && path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length);
  if (path === "") path = "/";
  // Next снимает хвостовой слеш до нас — приводим к виду "/x/".
  if (!path.endsWith("/")) path += "/";
  return path;
}

/** Отдаёт 301 для переехавших адресов и 410 для удалённых. */
export function middleware(request: NextRequest) {
  const path = normalize(request.nextUrl.pathname);

  // Тема: значение cookie передаём в заголовок запроса, корневой layout ставит класс на <html>.
  // Так страница отдаётся сразу в нужной теме — без вспышки светлой и без скрипта в body.
  const theme = themeClass(request.cookies.get(THEME_COOKIE)?.value);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-theme", theme);

  const target = REDIRECTS[path];
  if (target) {
    // nextUrl.pathname уже содержит BASE_PATH — поэтому задаём полный путь от корня.
    const url = new URL(BASE_PATH + target.replace(/\/$/, ""), request.nextUrl.origin);
    return NextResponse.redirect(url, 301);
  }

  if (GONE.includes(path)) {
    return new NextResponse(
      "<!DOCTYPE html><html lang=\"ru\"><head><meta charset=\"utf-8\"><title>Страница удалена</title></head><body><h1>Страница удалена</h1><p>Этой страницы больше нет. <a href=\"" + BASE_PATH + "/\">На главную</a></p></body></html>",
      { status: 410, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/|api/).*)"],
};