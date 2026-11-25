#!/usr/bin/env node
// Продление сертификата alyaev.ru (личный сайт проекта alyaev).
//
// Механика: порт 80 снаружи перехвачен оборудованием провайдера, поэтому HTTP-01
// невозможен. Валидация — TLS-ALPN-01 на 443. Прокси nginx занимает этот порт,
// значит lego нужен эксклюзивный доступ: останавливаем proxy, выпускаем, поднимаем.
//
// Правило владельца: сайт не ронять. Поэтому:
//   - продление только при остатке <= 30 дней (серт LE живёт 90);
//   - proxy поднимается в finally при ЛЮБОМ исходе, включая падение скрипта;
//   - после подъёма обязательно проверяется, что сайт отвечает 200.
//
// Запуск: node renew-cert-alyaev-ru.js [--force]
// Лог: E:\DockerData\alyaeva\logs\cert-alyaev-ru.log
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { X509Certificate } = require('crypto');

const DOCKER = 'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe';
const EMAIL = 'admin@alyaev.ru';
const DOMAINS = ['alyaev.ru', 'www.alyaev.ru'];
const FORCE = process.argv.includes('--force');

const CONF_DIR = 'E:\\DockerData\\alyaeva\\certbot\\conf';
const CERT_DIR = path.join(CONF_DIR, 'certificates');
const LIVE_DIR = path.join(CONF_DIR, 'live', 'alyaev.ru');
const LOG = 'E:\\DockerData\\alyaeva\\logs\\cert-alyaev-ru.log';
const RENEW_BEFORE_DAYS = 30;

/** Пишет строку в консоль и в лог-файл; сбой лога не роняет продление. */
function log(msg) {
  const line = '[' + new Date().toISOString() + '] ' + msg;
  console.log(line);
  try {
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    fs.appendFileSync(LOG, line + '\n');
  } catch (e) {}
}

/** Запускает docker с таймаутом и кодировкой utf8. */
const docker = (args, t) => spawnSync(DOCKER, args, { encoding: 'utf8', timeout: t || 300000 });

/** Сколько дней осталось сертификату; -1 если файла нет. */
function daysLeft() {
  try {
    const pem = fs.readFileSync(path.join(LIVE_DIR, 'fullchain.pem'), 'utf8');
    const cert = new X509Certificate(pem);
    return Math.floor((new Date(cert.validTo).getTime() - Date.now()) / 86400000);
  } catch (e) {
    return -1;
  }
}

/** Поднимает proxy и перезагружает nginx; возвращает код ответа сайта. */
function restoreProxy() {
  log('поднимаю proxy');
  docker(['start', 'proxy'], 60000);
  docker(['exec', 'proxy', 'nginx', '-s', 'reload'], 60000);
  return siteCode();
}

/** Проверяет, что сайт отдаёт 200 по домену (через внутренний адрес хоста). */
function siteCode() {
  const r = spawnSync('curl.exe', [
    '-sk', '--max-time', '20', '-o', 'NUL', '-w', '%{http_code}',
    '--resolve', 'alyaev.ru:443:192.168.8.49', 'https://alyaev.ru/'
  ], { encoding: 'utf8', timeout: 60000, env: Object.assign({}, process.env, {
    HTTP_PROXY: '', HTTPS_PROXY: '', NO_PROXY: '*'
  }) });
  return (r.stdout || '').trim();
}

log('--- старт проверки ---');
const left = daysLeft();
log('сертификат истекает через ' + left + ' дн.');
if (left > RENEW_BEFORE_DAYS && !FORCE) {
  log('обновление не требуется (>' + RENEW_BEFORE_DAYS + ' дней) — proxy не трогаю, простоя нет');
  process.exit(0);
}

log('осторожно: осталось ' + left + ' дн., запускаю продление');
log('останавливаю proxy (lego нужен порт 443) — простой ~15 сек');
docker(['stop', 'proxy'], 60000);

let exitCode = 1;
try {
  const args = ['run', '--rm', '--name', 'lego-alyaev-ru', '-p', '443:443',
    '-v', 'E:/DockerData/alyaeva/certbot/conf:/out', 'goacme/lego:latest',
    'run', '--accept-tos', '--email', EMAIL, '--path', '/out', '--tls'];
  DOMAINS.forEach(d => args.push('-d', d));
  const r = docker(args);
  log('lego exit=' + r.status);
  if (r.status === 0) {
    const crt = fs.readFileSync(path.join(CERT_DIR, 'alyaev.ru.crt'), 'utf8');
    const iss = fs.readFileSync(path.join(CERT_DIR, 'alyaev.ru.issuer.crt'), 'utf8');
    const key = fs.readFileSync(path.join(CERT_DIR, 'alyaev.ru.key'), 'utf8');
    fs.mkdirSync(LIVE_DIR, { recursive: true });
    fs.writeFileSync(path.join(LIVE_DIR, 'fullchain.pem'), crt.trimEnd() + '\n' + iss.trimEnd() + '\n');
    fs.writeFileSync(path.join(LIVE_DIR, 'privkey.pem'), key);
    log('live/ обновлён, новый срок: ' + daysLeft() + ' дн.');
    exitCode = 0;
  } else {
    log('lego вернул ошибку — сертификат НЕ обновлён (старый продолжает работать)');
  }
} catch (e) {
  log('исключение: ' + e.message);
} finally {
  const code = restoreProxy();
  log('проверка сайта после продления: ' + code);
  if (code !== '200') {
    log('ВНИМАНИЕ: сайт не отвечает 200 после продления!');
    exitCode = 1;
  }
}
log('--- конец, exit=' + exitCode + ' ---');
process.exit(exitCode);
