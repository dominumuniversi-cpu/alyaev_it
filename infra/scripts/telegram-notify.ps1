#requires -Version 5.1
<#
    Отправка уведомлений о новых заявках в Telegram с хоста Windows.

    Зачем отдельный скрипт: контейнеры на этом сервере не имеют доступа к
    api.telegram.org (TCP таймаутится ко всем DC Telegram), при этом с хоста
    Telegram доступен. Поэтому рассылка вынесена на хост.

    Правила (docs/manifests/telegram-notifications.md):
      - не шлём, если не заданы токен или chat_id;
      - одна заявка — одно сообщение, повторно не шлём (файл состояния);
      - ошибка отправки ничего не ломает, повтор на следующем круге;
      - в сообщении только имя, контакт, задача, текст и страница.

    Параметры:
      -DryRun   показать, что было бы отправлено, ничего не слать.
#>
param(
    [switch]$DryRun,
    # Прокси обязателен: на этом сервере Telegram доступен только через него.
    # По умолчанию берём из HTTPS_PROXY, можно переопределить параметром.
    [string]$Proxy
)

$ErrorActionPreference = "Continue"

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# --- прокси -------------------------------------------------------------
# Telegram на этом сервере доступен только через локальный прокси, поэтому
# ходим строго через него, а не «как получится».
if ([string]::IsNullOrWhiteSpace($Proxy)) {
    $all = [Environment]::GetEnvironmentVariables("Process")
    foreach ($k in $all.Keys) {
        if ($k -match "^(?i)https?_proxy$" -and -not [string]::IsNullOrWhiteSpace($all[$k])) {
            $Proxy = $all[$k]
            break
        }
    }
}

# Планировщик запускает скрипт от SYSTEM, а там переменных окружения с прокси
# нет. Поэтому адрес прокси по умолчанию прописан явно: без него запрос висит
# до таймаута, хотя через прокси Telegram отвечает сразу.
if ([string]::IsNullOrWhiteSpace($Proxy)) {
    $Proxy = "http://127.0.0.1:10809"
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile    = "E:\DockerData\alyaev-it\.env"
$stateFile  = "E:\DockerData\alyaev-it\telegram-state.json"
$logFile    = "E:\DockerData\alyaev-it\telegram-notify.log"

function Write-Log {
    param([string]$Text)
    $line = (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "  " + $Text
    try {
        Add-Content -Path $logFile -Value $line -Encoding UTF8
    } catch { }
    Write-Output $Text
}

function Get-EnvValue {
    param([string]$Path, [string]$Key)
    if (-not (Test-Path $Path)) { return $null }
    foreach ($line in Get-Content $Path -Encoding UTF8) {
        $pattern = "^\s*" + [regex]::Escape($Key) + "\s*=\s*(.*)$"
        if ($line -match $pattern) {
            return $Matches[1].Trim().Trim([char]34).Trim([char]39)
        }
    }
    return $null
}

if (-not (Test-Path $envFile)) {
    Write-Output "нет файла настроек: $envFile"
    exit 0
}

$token  = Get-EnvValue -Path $envFile -Key "TELEGRAM_BOT_TOKEN"
$chatId = Get-EnvValue -Path $envFile -Key "TELEGRAM_CHAT_ID"

if ([string]::IsNullOrWhiteSpace($token) -or [string]::IsNullOrWhiteSpace($chatId)) {
    Write-Log "уведомления выключены: не заданы TELEGRAM_BOT_TOKEN и/или TELEGRAM_CHAT_ID"
    exit 0
}

$state = @{ sent = @() }
if (Test-Path $stateFile) {
    try {
        $loaded = Get-Content $stateFile -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($loaded.sent) { $state.sent = @($loaded.sent) }
    } catch {
        Write-Output "файл состояния повреждён, начинаю с чистого"
    }
}

function Save-State {
    $dir = Split-Path -Parent $stateFile
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $json = @{ sent = @($state.sent) } | ConvertTo-Json -Depth 3 -Compress
    [System.IO.File]::WriteAllText($stateFile, $json, (New-Object System.Text.UTF8Encoding($false)))
}

$queryFile = Join-Path $env:TEMP "alyaev-leads.sql"
$query = @(
    "select coalesce(json_agg(json_build_object(",
    "  'id', id, 'name', name, 'contact', contact_value,",
    "  'task', task_type, 'message', message, 'page', source_page",
    ") order by id)::text, '[]')",
    "from leads",
    "where deleted_at is null and created_at > now() - interval '7 days';"
) -join " "
Set-Content -Path $queryFile -Value $query -Encoding ascii -NoNewline

& docker cp $queryFile alyaev-db:/tmp/alyaev-leads.sql 2>&1 | Out-Null
$raw = & docker exec alyaev-db psql -U alyaev -d alyaev -t -A -f /tmp/alyaev-leads.sql 2>&1
& docker exec alyaev-db rm -f /tmp/alyaev-leads.sql 2>&1 | Out-Null
Remove-Item $queryFile -Force -ErrorAction SilentlyContinue

$rawText = ($raw | Out-String).Trim()
if ([string]::IsNullOrWhiteSpace($rawText)) {
    Write-Output "не удалось прочитать заявки из базы"
    exit 1
}

$leads = @()
try { $leads = @($rawText | ConvertFrom-Json) } catch {
    Write-Output "ответ базы не разобрался как JSON"
    exit 1
}
if ($leads.Count -eq 0) { Write-Log "заявок нет, отправлять нечего"; exit 0 }

$sentNow = 0
foreach ($lead in $leads) {
    $key = [string]$lead.id
    if ($state.sent -contains $key) { continue }

    $lines = @("Новая заявка с сайта")
    $lines += "Имя: " + $lead.name
    $lines += "Контакт: " + $lead.contact
    if ($lead.task)    { $lines += "Задача: " + $lead.task }
    if ($lead.message) { $lines += "Сообщение: " + $lead.message }
    if ($lead.page)    { $lines += "Страница: " + $lead.page }
    $text = $lines -join "`n"

    if ($DryRun) {
        Write-Output ("--- заявка " + $key + " (DryRun) ---")
        Write-Output $text
        continue
    }

    $body = @{
        chat_id = $chatId
        text = $text
        disable_web_page_preview = $true
    } | ConvertTo-Json -Compress

    try {
        $uri = "https://api.telegram.org/bot" + $token + "/sendMessage"
        $resp = Invoke-RestMethod -Uri $uri -Method Post -Body $body `
            -ContentType "application/json; charset=utf-8" -TimeoutSec 25 -Proxy $Proxy
        if ($resp.ok) {
            $state.sent += $key
            $sentNow++
            Write-Log ("заявка " + $key + " отправлена")
        } else {
            Write-Log ("заявка " + $key + " не отправлена: ok=false")
        }
    } catch {
        Write-Log ("заявка " + $key + " не отправлена: " + $_.Exception.Message)
    }
}

if (-not $DryRun) {
    if ($state.sent.Count -gt 500) {
        $state.sent = @($state.sent | Select-Object -Last 500)
    }
    Save-State
    Write-Log ("проверено заявок: " + $leads.Count + ", отправлено сейчас: " + $sentNow + ", прокси: " + $Proxy)
}
