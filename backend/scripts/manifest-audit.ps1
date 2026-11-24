$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$manifests = Join-Path $root "docs/manifests"
$app = Join-Path $root "frontend/src/app"
$problems = @()

# Сверка 1: таблицы в базе против описания в schema.md
# Родительские таблицы public: pg_class.relkind='r' и схема по OID, без кавычек в SQL.
$sql = "SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname"
$raw = docker exec alyaev-db psql -U alyaev -d alyaev -t -A -c $sql 2>&1
# alembic_version - таблица миграций, доменных данных не хранит.
$skipTables = @("alembic_version")
$tables = @($raw | Where-Object { $_ -and $_.Trim() -ne "" -and $_ -notmatch "^psql:|WARNING|ERROR" } |
    ForEach-Object { $_.Trim() } | Where-Object { $skipTables -notcontains $_ })
$schemaText = [System.IO.File]::ReadAllText((Join-Path $manifests "db/schema.md"))
if ($tables.Count -eq 0) {
    $problems += "не удалось прочитать таблицы из базы - сверка пропущена"
} else {
    foreach ($t in $tables) {
        if ($schemaText -notmatch [regex]::Escape($t)) { $problems += "таблица в базе без описания: $t" }
    }
}

# Сверка 2: страницы в коде против манифеста адресов
$urlText = [System.IO.File]::ReadAllText((Join-Path $manifests "url-structure.md"))
$pages = Get-ChildItem -Path $app -Recurse -Filter "page.tsx" -File | Where-Object { $_.FullName -notmatch "node_modules" }
foreach ($p in $pages) {
    $rel = $p.DirectoryName.Substring($app.Length).Replace([char]92, [char]47)
    $route = "/" + $rel.Trim("/")
    # [slug] в Next и <slug> в манифесте — одна и та же страница.
    $norm = [regex]::Replace($route, '\[(\w+)\]', '<$1>')
    if (($urlText -notmatch [regex]::Escape($route)) -and ($urlText -notmatch [regex]::Escape($norm))) {
        $problems += "страница без описания в url-structure: $route"
    }
}

if ($problems.Count -eq 0) {
    Write-Output "расхождений нет (таблиц: $($tables.Count), страниц: $($pages.Count))"
    exit 0
}
$problems | ForEach-Object { Write-Output (" - " + $_) }
exit 1
