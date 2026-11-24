<#
.SYNOPSIS
    Сборка и выкатка сайта alyaev.it на стенде.

.DESCRIPTION
    Пересобирает указанный сервис и перезапускает его. По умолчанию — весь сайт.
    Сайт живёт по префиксу /alyaev за общим nginx; публикация — по IP, без домена.

.PARAMETER Service
    frontend | backend | all (по умолчанию all).

.PARAMETER NoBuild
    Перезапустить без пересборки образа (быстро, когда менялся только .env).

.EXAMPLE
    .\deploy.ps1
    Полная сборка и выкатка.

.EXAMPLE
    .\deploy.ps1 -Service backend
    Только backend — когда правился Python-код.
#>
param(
    [ValidateSet("frontend", "backend", "all")]
    [string]$Service = "all",

    [switch]$NoBuild
)

$ErrorActionPreference = "Stop"

$InfraDir = Split-Path -Parent $PSScriptRoot
$DataDir = "E:\DockerData\alyaev-it"
$EnvFile = Join-Path $DataDir ".env"
$Compose = "C:\Program Files\Docker\Docker\resources\cli-plugins\docker-compose.exe"
$SiteUrl = "https://188.226.71.169/alyaev/services"

function Write-Step($text) { Write-Host ""; Write-Host "==> $text" -ForegroundColor Cyan }

# Без .env compose соберётся с пустыми секретами — сайт поднимется, но не заработает.
if (-not (Test-Path $EnvFile)) {
    throw "Не найден файл окружения: $EnvFile"
}
if (-not (Test-Path $Compose)) {
    throw "Не найден docker-compose: $Compose"
}

Write-Step "Сборка и запуск: $Service"
$services = if ($Service -eq "all") { @("db", "backend", "frontend") } else { @($Service) }

$composeArgs = @("--env-file", $EnvFile, "up", "-d", "--force-recreate")
if (-not $NoBuild) { $composeArgs += "--build" }
$composeArgs += "--no-deps"
$composeArgs += $services

Push-Location $InfraDir
try {
    # Вызываем напрямую через &, а не через cmd /c: экранирование кавычек в PS 5.1
    # ломается на пути с пробелами ("C:\Program Files\..."), и команда не находится.
    # ErrorActionPreference временно ослаблен — docker пишет прогресс в stderr.
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & $Compose @composeArgs 2>&1 | ForEach-Object { Write-Host $_ }
    }
    finally {
        $ErrorActionPreference = $prev
    }
    if ($LASTEXITCODE -ne 0) { throw "docker-compose завершился с кодом $LASTEXITCODE" }
}
finally {
    Pop-Location
}

# Контейнер может быть "running", но приложение внутри ещё поднимается.
Write-Step "Ожидание готовности"
$ready = $false
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Seconds 3
    $code = & curl.exe -s -k -o NUL -w "%{http_code}" --max-time 8 $SiteUrl 2>$null
    if ($code -eq "200") { $ready = $true; break }
    Write-Host ("  попытка {0}: {1}" -f ($i + 1), $code)
}
if (-not $ready) {
    throw "Сайт не ответил 200 за 2 минуты. Смотрите: docker logs alyaev-web / alyaev-api"
}

Write-Host ""
Write-Host "Готово. Сайт отвечает 200." -ForegroundColor Green
Write-Host "  https://188.226.71.169/alyaev"
