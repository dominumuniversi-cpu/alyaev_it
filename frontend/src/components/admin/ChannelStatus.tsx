/** Предупреждение о ненастроенных уведомлениях. Манифест: docs/manifests/ui/admin-leads.md */

"use client";

import { useEffect, useState } from "react";

/** Показывает плашку, только если Telegram не настроен.
 *  Молча выключенное уведомление — худший вид отказа: заявка есть, а о ней никто не знает. */
export function ChannelStatus() {
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/admin/channel-status", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        setMissing(!data.telegram);
      })
      .catch(() => {
        // Не смогли узнать состояние — не пугаем владельца выдуманной проблемой.
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!missing) return null;

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-[color:var(--c-danger)] bg-[color:var(--c-paper-2)] p-4 text-sm"
    >
      <p className="font-semibold text-[color:var(--c-danger)]">Уведомления в Telegram не настроены</p>
      <p className="mt-1 text-[color:var(--c-muted)]">
        Новые заявки приходят только сюда, в админку. Пока не заданы токен бота и получатель,
        об обращении можно узнать, только открыв эту страницу.
      </p>
    </div>
  );
}
