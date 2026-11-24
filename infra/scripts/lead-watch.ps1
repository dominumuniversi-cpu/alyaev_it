<#
.SYNOPSIS
    Проверяет, есть ли заявки, о которых владелец не узнал: уведомления в Telegram
    выключены, а обращения уже лежат в базе.

.DESCRIPTION
    Молчаливый отказ дороже громкого. Пока TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID
    не заданы, сайт принимает заявки, но никого о них не уведомляет. Этот скрипт
    отвечает на один вопрос: сколько заявок ждёт включения уведомлений.

    Вызывается планировщиком раз в сутки (AlyaevIT-LeadWatch) и пишет в журнал:
    скрипт на каждой проверке пишет одну строку — есть что терять или нет.

    Код возврата: 0 — всё в порядке (уведомления работают либо заявок нет),
    2 — уведомления выключены, а в базе есть заявки за последние 30 дней.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File E:\DockerData\alyaev-it\scripts\lead-watch.ps1
#>

param(
    # Файл настроек, где лежат токен и получатель.
    [string]$EnvFile = "E:\DockerData\alyaev-it\.env",
    # Сколько последних дней считать. По умолчанию 30.
    [int]$Days = 30
)

$ErrorActionPreference = "Stop"

$LogDir = "E:\DockerData\alyaev-it\logs"
$LogFile = Join-Path $LogDir "lead-watch.log"

# Дописывает строку в журнал с датой. Журнал не даёт скрипту упасть, если каталога нет.
function Write-Log([string]$Message) {
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
    $stamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Add-Content -Path $LogFile -Value ("[" + $stamp + "] " + $Message) -Encoding UTF8
    Write-Output $Message
}

# Читает значение переменной из файла .env. Возвращает пустую строку, если ключа нет.
function Get-EnvValue([string]$Path, [string]$Key) {
    if (-not (Test-Path $Path)) { return "" }
    foreach ($line in Get-Content $Path -Encoding UTF8) {
        $trimmed = $line.Trim()
        if ($trimmed.StartsWith("#")) { continue }
        if ($trimmed -match ("^" + [regex]::Escape($Key) + "\s*=\s*(.*)$")) {
            return $Matches[1].Trim().Trim('"')
        }
    }
    return ""
}

# Форма слова «заявка» по числу: 1 заявка, 2 заявки, 5 заявок, 11 заявок.
function Get-LeadWord([int]$n) {
    $lastTwo = $n % 100
    $lastOne = $n % 10
    if ($lastTwo -ge 11 -and $lastTwo -le 14) { return "заявок" }
    if ($lastOne -eq 1) { return "заявка" }
    if ($lastOne -ge 2 -and $lastOne -le 4) { return "заявки" }
    return "заявок"
}

# Сколько заявок в базе за последние $Days дней. -1, если база недоступна.
function Get-PendingLeads([int]$Days) {
    $query = "select count(*) from leads where deleted_at is null and created_at > now() - interval '" + $Days + " days';"
    $raw = (& docker exec alyaev-db psql -U alyaev -d alyaev -t -A -c $query 2>&1 | Out-String).Trim()
    if ($raw -match '^\d+$') { return [int]$raw }
    return -1
}

$token  = Get-EnvValue -Path $EnvFile -Key "TELEGRAM_BOT_TOKEN"
$chatId = Get-EnvValue -Path $EnvFile -Key "TELEGRAM_CHAT_ID"

$pending = Get-PendingLeads -Days $Days

if ($pending -lt 0) {
    Write-Log "не удалось посчитать заявки: база недоступна"
    exit 1
}

if (-not [string]::IsNullOrWhiteSpace($token) -and -not [string]::IsNullOrWhiteSpace($chatId)) {
    Write-Log ("уведомления настроены, заявок за " + $Days + " дней: " + $pending)
    exit 0
}

if ($pending -eq 0) {
    Write-Log ("уведомления выключены, но заявок за " + $Days + " дней нет — терять нечего")
    exit 0
}

Write-Log ("ВНИМАНИЕ: уведомления выключены, а в базе " + $pending + " " + (Get-LeadWord $pending) + " за " + $Days + " дней. Задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID")
exit 2
