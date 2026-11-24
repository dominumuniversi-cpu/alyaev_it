<#
.SYNOPSIS
  Резервная копия базы alyaev. Манифест: docs/ops/BACKUP.md
.DESCRIPTION
  Делает pg_dump -Fc в E:\DockerData\alyaev-it\backups и чистит копии старше 14 дней,
  но только если остаётся не меньше 7 копий. Сбой расписания не должен стирать всё.
#>
param(
    [int]$KeepDays = 14,
    [int]$MinCopies = 7
)

$ErrorActionPreference = "Stop"
$BackupDir = "E:\DockerData\alyaev-it\backups"
$Container = "alyaev-db"
$DbUser = "alyaev"
$DbName = "alyaev"

if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }

# Имя с датой и временем: копии не перезаписывают друг друга.
$stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$fileName = "alyaev-$stamp.dump"
$tmpPath = "/tmp/$fileName"

Write-Output "Бэкап базы $DbName ..."
# -Fc: сжатый формат, восстанавливается pg_restore, позволяет выбрать таблицы.
$dump = & docker exec $Container pg_dump -U $DbUser -Fc -f $tmpPath $DbName 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Output "ОШИБКА pg_dump: $dump"
    exit 1
}

$copy = & docker cp "${Container}:${tmpPath}" "$BackupDir\$fileName" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Output "ОШИБКА docker cp: $copy"
    exit 1
}
& docker exec $Container rm -f $tmpPath 2>&1 | Out-Null

$size = (Get-Item "$BackupDir\$fileName").Length
if ($size -lt 1024) {
    Write-Output "ОШИБКА: бэкап подозрительно мал ($size байт) — считаем неуспешным."
    exit 1
}
Write-Output "Создан: $fileName ($([math]::Round($size/1KB,1)) КБ)"

# Ротация: только по возрасту И только если хватает копий.
$all = Get-ChildItem $BackupDir -Filter "alyaev-*.dump" | Sort-Object LastWriteTime
$old = $all | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) }
if ($old.Count -gt 0) {
    $remaining = $all.Count - $old.Count
    if ($remaining -ge $MinCopies) {
        $old | ForEach-Object { Remove-Item $_.FullName -Force; Write-Output "Удалён старый: $($_.Name)" }
    } else {
        Write-Output "Старые копии не удалены: осталось бы меньше $MinCopies (сейчас $remaining)."
    }
}

$total = (Get-ChildItem $BackupDir -Filter "alyaev-*.dump").Count
Write-Output "Всего копий: $total"
exit 0