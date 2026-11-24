<#
.SYNOPSIS
  Проверка бэкапа восстановлением во временную базу. Манифест: docs/ops/BACKUP.md
.DESCRIPTION
  Восстанавливает дамп в alyaev_verify, сверяет число строк в ключевых таблицах
  с рабочей базой, удаляет временную базу. Рабочая база не трогается.
#>
param(
    [string]$File = ""
)

$ErrorActionPreference = "Stop"
# PS 5.1: docker пишет NOTICE в stderr, и Stop превращает это в падение. Гасим stderr и смотрим код выхода.
$BackupDir = "E:\DockerData\alyaev-it\backups"
$Container = "alyaev-db"
$DbUser = "alyaev"
$DbName = "alyaev"
$VerifyDb = "alyaev_verify"
# Планировщик не видит stdout — без файла результат проверки пропадает молча.
$LogDir = "E:\DockerData\alyaev-it\logs"
$LogFile = Join-Path $LogDir "verify-backup.log"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-Log([string]$Text) {
    Write-Output $Text
    # файл пополняется, а не перезаписывается: нужна история, а не последняя строка
    Add-Content -Path $LogFile -Value ("[" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "] " + $Text) -Encoding UTF8
}

# По умолчанию — последний бэкап.
if ([string]::IsNullOrWhiteSpace($File)) {
    $last = Get-ChildItem $BackupDir -Filter "alyaev-*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -eq $last) { Write-Log "Нет бэкапов для проверки."; exit 1 }
    $File = $last.FullName
}
Write-Log "Проверяем: $(Split-Path $File -Leaf)"

$tmp = "/tmp/verify.dump"
# docker cp работает напрямую: в cmd /c путь с обратными слешами ломается.
docker cp $File "${Container}:${tmp}" | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Log "ОШИБКА: не удалось скопировать дамп."; exit 1 }

# Создаём временную базу. Рабочая база не затрагивается.
# psql пишет NOTICE в stderr — гасим его, иначе Stop-режим падает на пустом месте.
cmd /c "docker exec $Container psql -U $DbUser -d postgres -c ""DROP DATABASE IF EXISTS $VerifyDb;"" >NUL 2>NUL"
cmd /c "docker exec $Container psql -U $DbUser -d postgres -c ""CREATE DATABASE $VerifyDb;"" >NUL 2>NUL"
if ($LASTEXITCODE -ne 0) { Write-Log "ОШИБКА: не удалось создать временную базу."; exit 1 }

$restore = cmd /c "docker exec $Container pg_restore -U $DbUser -d $VerifyDb --no-owner $tmp 2>&1"
$restoreExit = $LASTEXITCODE
if ($restoreExit -ne 0) {
    Write-Log "ОШИБКА восстановления (код $restoreExit): $($restore | Select-Object -First 5)"
    cmd /c "docker exec $Container psql -U $DbUser -d postgres -c ""DROP DATABASE IF EXISTS $VerifyDb;"" >NUL 2>NUL"
    exit 1
}

# Сверяем ключевые таблицы: если бэкап пустой или битый, числа разойдутся.
# Список таблиц берём из живой базы: забытая таблица не должна остаться непроверенной.
$tableQuery = "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'alembic_version' ORDER BY tablename"
$tables = @(cmd /c "docker exec $Container psql -U $DbUser -d $DbName -t -A -c ""$tableQuery"" 2>NUL" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() })
$mismatch = 0
foreach ($t in $tables) {
    # Проверенная форма: SQL в двойных кавычках, удвоенных внутри cmd /c.
    $q = "SELECT count(*) FROM $t"
    # Пустой вывод = таблицы в копии нет. Без этой ветки .Trim() падает на $null,
    # и вместо понятного расхождения получаем невнятную ошибку.
    $liveRaw = cmd /c "docker exec $Container psql -U $DbUser -d $DbName -t -A -c ""$q"" 2>NUL" | Select-Object -First 1
    $copyRaw = cmd /c "docker exec $Container psql -U $DbUser -d $VerifyDb -t -A -c ""$q"" 2>NUL" | Select-Object -First 1
    $live = if ($null -eq $liveRaw) { "нет" } else { $liveRaw.Trim() }
    $copy = if ($null -eq $copyRaw) { "нет таблицы" } else { $copyRaw.Trim() }
    $mark = "OK "
    if ($live -ne $copy) { $mark = "РАСХОЖДЕНИЕ"; $mismatch++ }
    Write-Log "$mark $t : рабочая=$live бэкап=$copy"
}

cmd /c "docker exec $Container psql -U $DbUser -d postgres -c ""DROP DATABASE IF EXISTS $VerifyDb;"" >NUL 2>NUL"
cmd /c "docker exec $Container rm -f $tmp >NUL 2>NUL"

if ($mismatch -gt 0) { Write-Log "БЭКАП НЕПРИГОДЕН: $mismatch таблиц расходятся."; exit 1 }
Write-Log "Бэкап проверен: восстановление успешно, данные совпадают."
exit 0