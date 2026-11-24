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

```powershell
docker exec alyaev-api alembic upgrade head
```

## 6. Бэкап/восстановление

- Бэкап: `repo\infra\scripts\backup.ps1` → `E:\DockerData\alyaev-it\backups\`. Глубина 14 дней.
- Восстановление: `repo\infra\scripts\restore.ps1 -File <dump>`. Только по решению владельца.
