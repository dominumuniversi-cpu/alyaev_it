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
# Файлы (документы клиентов, изображения) живут отдельно от базы:
# bind-монтирование E:\DockerData\alyaev-it\media. Без них восстановление
# вернёт записи в documents с битыми ссылками на несуществующие файлы.
$MediaDir = "E:\DockerData\alyaev-it\media"
if (Test-Path $MediaDir) {
    $mediaCount = (Get-ChildItem $MediaDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
    if ($mediaCount -gt 0) {
        $mediaFile = "alyaev-media-$stamp.zip"
        $mediaZip = Join-Path $BackupDir $mediaFile
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::CreateFromDirectory($MediaDir, $mediaZip)
        $mz = (Get-Item $mediaZip).Length
        Write-Output "Файлы: $mediaCount шт., архив $mediaFile ($([math]::Round($mz/1KB,1)) КБ)"
    } else {
        Write-Output "Файлов нет — архив media пропущен."
    }
} else {
    Write-Output "Каталог media не найден — архив пропущен."
}

# Ротация: только по возрасту И только если хватает копий.
# Ловушка: Get-ChildItem -Include без -Recurse на каталоге возвращает 0 файлов
# (проверено: без -Recurse 0, через Where-Object 4) — ротация молча не работала.
# Плюс в ротацию попадают только файлы самого скрипта (alyaev-DATE.dump /
# alyaev-media-DATE.zip): чужой pre-migration_*.dump трогать нельзя.
$all = @(Get-ChildItem $BackupDir -File | Where-Object {
    ($_.Name -like "alyaev-*.dump" -or $_.Name -like "alyaev-media-*.zip") -and
    $_.Name -match "^alyaev-(media-)?\d{4}-\d{2}-\d{2}_\d{6}\.(dump|zip)" -and
    $_.Name -notlike "pre-migration*"
} | Sort-Object LastWriteTime)
$old = $all | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) }
if ($old.Count -gt 0) {
    # Остаток считаем по свежим файлам, а не вычитанием: иначе после первого
    # прохода $all сдвигается и счёт врёт.
    $left = @($all | Where-Object { $_.LastWriteTime -ge (Get-Date).AddDays(-$KeepDays) })
    $remaining = $left.Count
    if ($remaining -ge $MinCopies) {
        $old | ForEach-Object { Remove-Item $_.FullName -Force; Write-Output "Удалён старый: $($_.Name)" }
    } else {
        Write-Output "Старые копии не удалены: осталось бы меньше $MinCopies (сейчас $remaining)."
    }
}

$totalDump = @(Get-ChildItem $BackupDir -File | Where-Object { $_.Name -like "alyaev-*.dump" }).Count
$totalMedia = @(Get-ChildItem $BackupDir -File | Where-Object { $_.Name -like "alyaev-media-*.zip" }).Count
Write-Output "Всего копий: баз $totalDump, архивов файлов $totalMedia"

exit 0