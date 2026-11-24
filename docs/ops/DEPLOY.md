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
| Nginx-роут | `E:\DockerData\nginx\stands\alyaev.conf` |

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

## 4. Nginx

Роут: `E:\DockerData\nginx\stands\alyaev.conf` (лукейшн `/alyaev/`).

```powershell
docker exec proxy nginx -t
docker exec proxy nginx -s reload
```

> **Ловушка (проверено):** в `nginx.conf` `include /etc/nginx/vhosts/*.conf` стоит **внутри `http{}`**,
> поэтому файл в `vhosts/` должен содержать ПОЛНЫЙ `server { ... }` (как `alyaeva.pro.conf`).
> Содержимое `stands/*.conf` — это только `location {}` и подключается внутрь `server{...}`.
> Файл с `location` в `vhosts/` = ошибка конфига.

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