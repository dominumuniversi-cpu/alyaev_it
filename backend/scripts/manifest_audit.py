"""Ревизия манифестов: три сверки из docs/rules/RULES.md.

Работает на ХОСТЕ: манифесты и frontend в образ бэкенда не копируются.
Сверка с базой идёт через docker exec psql, код только читается.

Запуск:
    python backend/scripts/manifest_audit.py
"""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFESTS = ROOT / "docs" / "manifests"
APP = ROOT / "frontend" / "src" / "app"
DB_CONTAINER = "alyaev-db"


def db_tables() -> set[str]:
    """Таблицы в базе — запросом через psql в контейнере."""
    sql = (
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema='public' AND table_type='BASE TABLE'"
    )
    out = subprocess.run(
        ["docker", "exec", DB_CONTAINER, "psql", "-U", "alyaev", "-d", "alyaev", "-t", "-A", "-c", sql],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if out.returncode != 0:
        return set()
    return {line.strip() for line in out.stdout.splitlines() if line.strip()}


def check_tables() -> list[str]:
    """Сверка 1: таблицы в базе ↔ описание в schema.md."""
    schema_md = (MANIFESTS / "db" / "schema.md").read_text(encoding="utf-8")
    live = db_tables()
    if not live:
        return ["не удалось прочитать таблицы из базы — сверка пропущена"]
    return [f"таблица в базе без описания: {t}" for t in sorted(live) if t not in schema_md]


def check_pages() -> list[str]:
    """Сверка 2: страницы в коде ↔ url-structure.md."""
    url_md = (MANIFESTS / "url-structure.md").read_text(encoding="utf-8")
    if not APP.exists():
        return ["папка приложения не найдена — сверка пропущена"]
    problems = []
    for page in APP.rglob("page.tsx"):
        route = "/" + "/".join(page.parent.relative_to(APP).parts)
        if route == "/.":
            route = "/"
        normalized = re.sub(r"\[(\w+)\]", r"<\1>", route)
        if route not in url_md and normalized not in url_md:
            problems.append(f"страница без описания в url-structure: {route}")
    return problems


def main() -> int:
    """Печатает расхождения; код 1, если они есть."""
    problems = check_tables() + check_pages()
    if not problems:
        print("расхождений нет")
        return 0
    for item in problems:
        print(" -", item)
    return 1


if __name__ == "__main__":
    sys.exit(main())