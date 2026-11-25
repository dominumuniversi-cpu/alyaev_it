# Развёртывание и эксплуатация стенда

> Стенд: локальный DIMAS. Данные: `E:\DockerData\alyaev-it`. Конфиг nginx: `E:\DockerData\nginx`.

## 1. Раскладка

| Что | Где |
|---|---|
| Код | `E:\!Develop\sites\MY\repo` (git → GitHub dominumuniversi-cpu/alyaev_it) |
| Compose | `repo\infra\docker-compose.yml` |
| Секреты | `E:\DockerData\alyaev-it\.env` (вне репозитория!) |
| Postgres | `E:\DockerData\alyaev-it\pgdata` |
| Бэкапы | `E:\DockerData\alyaev-it\backups` |
| Nginx-вхост домена | `E:\DockerData\nginx\vhosts\alyaev.ru.conf` |
| Сертификат | `E:\DockerData\alyaeva\certbot\conf\live\alyaev.ru` |

## 2. Контейнеры

| Контейнер | Образ | Порт (внутренний) |
|---|---|---|
| `alyaev-db` | pgvector/pgvector:pg17 | 5432 |
| `alyaev-api` | alyaev-it-backend | 8000 |
| `alyaev-web` | alyaev-it-frontend | 3000 |

Все в сети `npc-proxy-net`. **Наружу портов нет** — только через общий `proxy`.

## 3. Приёмка вручную: `docker compose`

В этом окружении `docker compose` как подкоманда клиента НЕ работает (плагин не подключён).
Использовать бинарь плагина напрямую и **обязательно `--env-file`**:

```powershell
$cmp = "C:\Program Files\Docker\Docker\resources\cli-plugins\docker-compose.exe"
cd E:\!Develop\sites\MY\repo\infra
& $cmp --env-file E:\DockerData\alyaev-it\.env up -d --build
```

`--env-file` обязателен: переменные `POSTGRES_*` для интерполяции берутся только оттуда,
а `env_file:` в compose **запрещён** установленной версией compose (additional property not allowed).

## 4. Nginx и домен

Сайт открыт по домену **https://alyaev.ru** — из корня, без префикса пути.
Вхост: `E:\DockerData\nginx\vhosts\alyaev.ru.conf` (полный `server{}`, подключается в `http{}`).
`www.alyaev.ru` отвечает 301 на основной хост.

### BASE_PATH: почему сайт был в /alyaev/

`BASE_PATH` задаёт префикс, под которым Next.js живёт. На стенде это `/alyaev`, на домене — пусто (корень).
В compose стоит `BASE_PATH: ${FRONTEND_BASE_PATH}` **без** `:-/alyaev`.

> **Ловушка (проверено 25.11.2026):** синтаксис `${VAR:-default}` в Compose не различает
> «переменная не задана» и «переменная задана пустой» — в обоих случаях подставляется default.
> С `:-` пустой `FRONTEND_BASE_PATH=` давал `/alyaev`, и корень домена отдавал 404.
> Решение: убрать `:-default` из выражения, значение писать в `.env` явно.
> Текущее значение в `E:\DockerData\alyaev-it\.env`: `FRONTEND_BASE_PATH=` (пусто = корень).

### Порт 80 не используется

Внешний порт 80 перехватывает оборудование провайдера — запрос до нашего nginx не доходит.
Поэтому вхост слушает **только 443**, а сертификат валидируется через **TLS-ALPN-01** на 443.
HTTP-запросы из локальной сети обслуживает catch-all в `nginx.conf` (301 на https).

```powershell
docker exec proxy nginx -t
docker exec proxy nginx -s reload
```

> **Ловушка (проверено):** в `nginx.conf` `include /etc/nginx/vhosts/*.conf` стоит **внутри `http{}`**,
> поэтому файл в `vhosts/` должен содержать ПОЛНЫЙ `server { ... }` (как `alyaeva.pro.conf`).
> Содержимое `stands/*.conf` — это только `location {}` и подключается внутрь `server{...}`.
> Файл с `location` в `vhosts/` = ошибка конфига.

## 4а. SSL-сертификат и автопродление

| Что | Значение |
|---|---|
| Удостоверяющий центр | Let's Encrypt (срок 90 дней) |
| Домены в сертификате | `alyaev.ru`, `www.alyaev.ru` |
| Контактный e-mail аккаунта | `admin@alyaev.ru` |
| Способ валидации | TLS-ALPN-01 на порту 443 (порт 80 снаружи недоступен) |
| Файлы | `live\alyaev.ru\fullchain.pem` + `privkey.pem` |
| Скрипт продления | `repo\infra\scripts\renew-cert-alyaev-ru.js` |
| Задача планировщика | `AlyaevRu-CertRenew`, воскресенье 04:00, от SYSTEM |
| Лог | `E:\DockerData\alyaeva\logs\cert-alyaev-ru.log` |

### Как часто обновляется

Сертификат Let's Encrypt живёт **90 дней**. Скрипт запускается раз в неделю, но реально что-то делает
только когда до истечения осталось **≤ 30 дней** — так заложено в `RENEW_BEFORE_DAYS`.

Зачем так: у Let's Encrypt лимит 5 выпусков на один и тот же набор доменов в неделю. Частые перевыпуски
упираются в лимит и могут оставить сайт без сертификата. Проверка раз в неделю + порог 30 дней даёт
широкое окно на восстановление, если очередной запуск не пройдёт.

### Как продлить вручную

```powershell
node E:\!Develop\sites\MY\repo\infra\scripts\renew-cert-alyaev-ru.js          # по порогу 30 дней
node E:\!Develop\sites\MY\repo\infra\scripts\renew-cert-alyaev-ru.js --force  # перевыпуск сразу
```

> **Простой при продлении.** Валидация TLS-ALPN требует эксклюзивного владения портом 443,
> поэтому `proxy` останавливается на ~15 секунд. Скрипт поднимает его в `finally` при любом исходе
> и после подъёма проверяет, что сайт отдаёт 200. Если проверка не прошла — в логе строка
> «ВНИМАНИЕ: сайт не отвечает 200».

> **Ловушка (проверено 25.11.2026):** `docker run -p 127.0.0.1:443:443` для lego **не работает** —
> серверы Let's Encrypt подключаются снаружи и до привязки только к loopback не доходят,
> валидация падает с `Timeout during connect`. Нужно `-p 443:443` (все интерфейсы).

## 5. Миграции

Схема БД версионируется alembic. Каталог `backend/alembic`, ревизии — `backend/alembic/versions`.

```powershell
docker exec -w /app alyaev-api alembic upgrade head     # применить
docker exec -w /app alyaev-api alembic current         # что применено
docker exec -w /app alyaev-api alembic check           # база совпадает с моделями?
```

```powershell
# Новая миграция после правки app/db/models.py
docker exec -w /app alyaev-api alembic revision --autogenerate -m "что изменили"
docker cp alyaev-api:/app/alembic/versions/<файл>.py backend/alembic/versions/
```

> **Правила:**
> 1. Ревизии генерируются **внутри контейнера** и копируются в репозиторий — иначе они теряются при пересборке.
> 2. `alembic check` должен говорить «No new upgrade operations detected». Если он предлагает удалить
>    индекс или колонку — значит в модели чего-то нет, а в базе есть. Правится модель, а не база.
> 3. Не править живой сайт `--force-recreate` без `alembic upgrade head` в той же команде.
> 4. Baseline-ревизия `b7b4674a9b88` описывает схему на 24.11.2026. Она уже помечена применённой
>    (`alembic stamp head`) на рабочей базе — повторно применять её к рабочей базе нельзя.

## 6. Бэкап/восстановление

- Бэкап: `repo\infra\scripts\backup.ps1` → `E:\DockerData\alyaev-it\backups\`. Глубина 14 дней.
- Восстановление: `repo\infra\scripts\restore.ps1 -File <dump>`. Только по решению владельца.

## 6. Резервное копирование и восстановление

Полные правила — `docs/ops/BACKUP.md`. Коротко для эксплуатации:

| Действие | Команда |
|---|---|
| Сделать бэкап сейчас | `infra\scripts\backup.ps1` |
| Проверить последний бэкап | `infra\scripts\verify-backup.ps1` |
| Проверить конкретный | `infra\scripts\verify-backup.ps1 -File <путь>` |
| Восстановить | `infra\scripts\restore.ps1 -File <путь>` |

**Расписание:** задача планировщика `AlyaevIT-Backup`, ежедневно 03:30, от имени SYSTEM.
Проверить: `schtasks /query /tn "AlyaevIT-Backup" /fo LIST /v` (Last Result должен быть 0).

**Восстановление всегда сначала делает страховочную копию.** Если ошиблись файлом —
предыдущее состояние осталось в `E:\DockerData\alyaev-it\backups`.

**Проверено 24.11.2026:** бэкап → восстановление во временную базу → сверка **всех 21 таблицы** → совпало;
восстановление в рабочую базу → 21 таблица, миграции на head, сайт отдаёт 200.

Сверка «5 таблиц» из прежней редакции устарела: список брался вручную, и новые таблицы
(статьи, портфолио, решения) в проверку не попадали. Теперь список берётся из `pg_tables`,
а отсутствующая в копии таблица считается расхождением. Подробности — в `BACKUP.md`.