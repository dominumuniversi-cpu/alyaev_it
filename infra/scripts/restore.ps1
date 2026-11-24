<#
.SYNOPSIS
  Восстановление базы alyaev из бэкапа. Манифест: docs/ops/BACKUP.md
.DESCRIPTION
  Перед восстановлением делает страховочную копию текущего состояния:
  восстановление по ошибке без неё уничтожило бы данные, которые ещё целы.
#>
param(
    [Parameter(Mandatory=$true)][string]$File
)

$ErrorActionPreference = "Stop"
$Container = "alyaev-db"
$DbUser = "alyaev"
$DbName = "alyaev"
$BackupDir = "E:\DockerData\alyaev-it\backups"

if (-not (Test-Path $File)) { Write-Output "Файл не найден: $File"; exit 1 }

# Страховка: без неё ошибка восстановления необратима.
Write-Output "Страховочная копия текущего состояния..."
& "$PSScriptRoot\backup.ps1" 2>&1 | Out-String | Write-Output
if ($LASTEXITCODE -ne 0) { Write-Output "ОШИБКА страховочной копии — восстановление отменено."; exit 1 }

$tmp = "/tmp/restore.dump"
# docker cp напрямую: в cmd /c путь с обратными слешами ломается.
docker cp $File "${Container}:${tmp}" | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Output "ОШИБКА копирования дампа в контейнер."; exit 1 }

Write-Output "Восстанавливаем базу $DbName из $(Split-Path $File -Leaf)..."
# --clean --if-exists: убирает объекты перед созданием, чтобы не было конфликтов.
# -Fc дамп восстанавливается pg_restore.
$out = cmd /c "docker exec $Container pg_restore -U $DbUser -d $DbName --clean --if-exists --no-owner $tmp 2>&1"
$code = $LASTEXITCODE
cmd /c "docker exec $Container rm -f $tmp >NUL 2>NUL"

# pg_restore возвращает 1 при предупреждениях (нет прав на владельца и т.п.) — это не провал.
if ($code -gt 1) { Write-Output "ОШИБКА восстановления (код $code):"; $out | Select-Object -First 8 | Write-Output; exit 1 }

# Проверяем, что база жива и таблицы на месте.
$tables = (cmd /c "docker exec $Container psql -U $DbUser -d $DbName -t -A -c ""SELECT count(*) FROM information_schema.tables WHERE table_schema=current_schema()"" 2>NUL" | Select-Object -First 1)
if ([string]::IsNullOrWhiteSpace($tables) -or [int]$tables -lt 10) {
    Write-Output "ОШИБКА: после восстановления таблиц мало ($tables). Проверьте базу."
    exit 1
}
Write-Output "Восстановлено. Таблиц: $tables"

# Схема должна совпадать с репозиторием — иначе приложение упадёт на несовпадении.
Write-Output "Проверка миграций:"
$rev = cmd /c "docker exec -w /app alyaev-api alembic current 2>&1"
$rev | Select-Object -Last 2 | Write-Output
exit 0