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

# По умолчанию — последний бэкап.
if ([string]::IsNullOrWhiteSpace($File)) {
    $last = Get-ChildItem $BackupDir -Filter "alyaev-*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -eq $last) { Write-Output "Нет бэкапов для проверки."; exit 1 }
    $File = $last.FullName
}
Write-Output "Проверяем: $(Split-Path $File -Leaf)"

$tmp = "/tmp/verify.dump"
# docker cp работает напрямую: в cmd /c путь с обратными слешами ломается.
docker cp $File "${Container}:${tmp}" | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Output "ОШИБКА: не удалось скопировать дамп."; exit 1 }

# Создаём временную базу. Рабочая база не затрагивается.
# psql пишет NOTICE в stderr — гасим его, иначе Stop-режим падает на пустом месте.
cmd /c "docker exec $Container psql -U $DbUser -d postgres -c ""DROP DATABASE IF EXISTS $VerifyDb;"" >NUL 2>NUL"
cmd /c "docker exec $Container psql -U $DbUser -d postgres -c ""CREATE DATABASE $VerifyDb;"" >NUL 2>NUL"
if ($LASTEXITCODE -ne 0) { Write-Output "ОШИБКА: не удалось создать временную базу."; exit 1 }

$restore = cmd /c "docker exec $Container pg_restore -U $DbUser -d $VerifyDb --no-owner $tmp 2>&1"
$restoreExit = $LASTEXITCODE
if ($restoreExit -ne 0) {
    Write-Output "ОШИБКА восстановления (код $restoreExit): $($restore | Select-Object -First 5)"
    cmd /c "docker exec $Container psql -U $DbUser -d postgres -c ""DROP DATABASE IF EXISTS $VerifyDb;"" >NUL 2>NUL"
    exit 1
}

# Сверяем ключевые таблицы: если бэкап пустой или битый, числа разойдутся.
$tables = @("services", "service_categories", "leads", "seo_metadata", "site_settings")
$mismatch = 0
foreach ($t in $tables) {
    # Проверенная форма: SQL в двойных кавычках, удвоенных внутри cmd /c.
    $q = "SELECT count(*) FROM $t"
    $live = (cmd /c "docker exec $Container psql -U $DbUser -d $DbName -t -A -c ""$q"" 2>NUL" | Select-Object -First 1).Trim()
    $copy = (cmd /c "docker exec $Container psql -U $DbUser -d $VerifyDb -t -A -c ""$q"" 2>NUL" | Select-Object -First 1).Trim()
    if ($null -eq $live) { $live = "?" }
    if ($null -eq $copy) { $copy = "?" }
    $mark = "OK "
    if ($live -ne $copy) { $mark = "РАСХОЖДЕНИЕ"; $mismatch++ }
    Write-Output "$mark $t : рабочая=$live бэкап=$copy"
}

cmd /c "docker exec $Container psql -U $DbUser -d postgres -c ""DROP DATABASE IF EXISTS $VerifyDb;"" >NUL 2>NUL"
cmd /c "docker exec $Container rm -f $tmp >NUL 2>NUL"

if ($mismatch -gt 0) { Write-Output "БЭКАП НЕПРИГОДЕН: $mismatch таблиц расходятся."; exit 1 }
Write-Output "Бэкап проверен: восстановление успешно, данные совпадают."
exit 0