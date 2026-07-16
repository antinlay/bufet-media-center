# Home Hosting (Windows) - BUFET MVP

Этот bundle запускает тот же состав, что и Railway: PostgreSQL, Rails API, Expo web dashboard и Caddy с HTTPS.

## Что нужно один раз

- Windows 10/11 и Docker Desktop в режиме Linux containers.
- В Docker Desktop включить `Start Docker Desktop when you sign in`.
- Два DNS-имени, указывающие на внешний IP дома: API и dashboard. В примере используются DuckDNS.
- На роутере пробросить TCP `80` и `443` на Windows-компьютер. Желательно закрепить ему локальный IP.

## DuckDNS

1. Откройте [duckdns.org](https://www.duckdns.org/) и войдите в аккаунт.
2. В разделе доменов создайте два subdomain: `bufet-api` и `bufet-dashboard`.
3. DuckDNS сформирует адреса `bufet-api.duckdns.org` и `bufet-dashboard.duckdns.org`.
4. Скопируйте account token и сохраните его как секрет.
5. Обновите оба домена на текущий внешний IPv4 с Windows PowerShell:

```powershell
$token = "ВАШ_DUCKDNS_TOKEN"
Invoke-RestMethod "https://www.duckdns.org/update?domains=bufet-api,bufet-dashboard&token=$token&verbose=true"
```

Нормальный ответ начинается с `OK`. Если домашний внешний IP меняется, настройте этот запрос как Scheduled Task. DuckDNS также поддерживает готовую Windows-инструкцию и HTTP API для обновления нескольких доменов одним запросом.

Проверить DNS можно с любого компьютера:

```bash
dig +short bufet-api.duckdns.org
dig +short bufet-dashboard.duckdns.org
```

Результатом должен быть внешний IP роутера. Адрес `192.168.0.127` в DuckDNS указывать нельзя: это локальный адрес Windows-компьютера.

## Первый запуск

Скопируйте репозиторий на Windows, например в `C:\bufet`, затем в PowerShell:

```powershell
cd C:\bufet\deploy\home-windows
Copy-Item .env.example .env
notepad .env
```

В `.env` обязательно заполните `SECRET_KEY_BASE`, замените пароль PostgreSQL и проверьте домены. `DATABASE_URL` должен содержать тот же пароль, что и `POSTGRES_PASSWORD`; для простоты используйте URL-safe пароль без `@`, `:`, `/` и `#`.

Сгенерировать секрет без Python:

```powershell
$bytes = [byte[]]::new(64)
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[BitConverter]::ToString($bytes).Replace('-', '').ToLower()
```

Вставьте результат в `SECRET_KEY_BASE`. Затем запустите весь стек:

```powershell
docker compose up -d --build
docker compose ps
```

Dashboard теперь собирается внутри Docker, поэтому ничего не нужно собирать на Mac и копировать вручную.

## Автозапуск и запрет сна

PowerShell от имени администратора:

```powershell
cd C:\bufet\deploy\home-windows
Set-ExecutionPolicy -Scope Process Bypass
.\install-autostart.ps1
```

Скрипт создаёт задачу запуска Compose при входе пользователя и отключает сон/гибернацию при питании от сети. `start-bufet.ps1` ждёт готовности Docker Desktop, поэтому перезапуск после включения компьютера безопасен.

## Проверка снаружи сети

С телефона через LTE проверьте:

- `https://bufet-api.duckdns.org/up` — HTTP 200;
- `https://bufet-dashboard.duckdns.org/pair` — открывается dashboard.

Логи:

```powershell
docker compose logs -f api
docker compose logs -f caddy
```

Если не работает: проверьте DNS, проброс портов, Windows Firewall и не блокирует ли провайдер входящие 80/443. Для доступа из той же Wi-Fi сети может потребоваться NAT loopback или локальная DNS-переадресация.

## Обновление

```powershell
cd C:\bufet
git pull
cd deploy\home-windows
docker compose up -d --build
```

## Важное ограничение

В отличие от Railway, локальный PostgreSQL не получает облачные backups автоматически. Сохраняйте volume `postgres_data` и периодически делайте `pg_dump` на внешний диск.
