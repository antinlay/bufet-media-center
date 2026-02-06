# Home Hosting (Windows) - BUFET MVP

Goal: run the Rails backend (`apps/api`) and the web dashboard (`apps/bufet-media-dashboard`) from a home Windows PC with a public IPv4, using DuckDNS + Caddy + Docker.

This gives you stable public URLs:
- `https://bufet-api.duckdns.org`
- `https://bufet-dashboard.duckdns.org`

## 0) Prereqs
- Windows 10/11 host that can stay on 24/7
- Docker Desktop (Linux containers)
- Router admin access (port forwarding)
- A phone on LTE (or any external network) to test access from the internet

## 1) DuckDNS
Create two DuckDNS subdomains and point both to your public IP:
- `bufet-api.duckdns.org`
- `bufet-dashboard.duckdns.org`

Set up DuckDNS auto-update (Scheduled Task) so the IP stays correct if it changes.

## 2) Router: static LAN IP + port forwarding
Reserve a static LAN IP for your Windows host, example: `192.168.1.10`.

Forward ports to the host:
- `TCP 80 -> 192.168.1.10:80`
- `TCP 443 -> 192.168.1.10:443`

Windows Firewall:
- Allow inbound TCP 80/443 (or allow Docker Desktop / com.docker.* if needed).

## 3) Prepare directories on Windows
Pick a folder, example `C:\bufet\`.

Create:
- `C:\bufet\concerto\storage` (SQLite DB + ActiveStorage files)
- `C:\bufet\dashboard\dist` (static dashboard build output)

## 4) Build dashboard (on Mac) and copy to Windows
Build web files (static) for hosting.

From macOS:
```bash
cd /Users/janiecee/Developer/Buffet/apps/bufet-media-dashboard
EXPO_PUBLIC_API_URL=https://bufet-api.duckdns.org pnpm dlx expo export -p web --output-dir dist
```

Copy `apps/bufet-media-dashboard/dist/*` to Windows:
- `C:\bufet\dashboard\dist`

Verify on Windows: `C:\bufet\dashboard\dist\index.html` exists.

## 5) Generate SECRET_KEY_BASE
On Windows PowerShell:
```powershell
python - << 'PY'
import secrets
print(secrets.token_hex(64))
PY
```

If you don't have Python, use any strong random generator (at least 64 bytes).

## 6) Create .env and run Docker Compose
Copy `.env.example` to `.env` and fill values:
- `SECRET_KEY_BASE=...`
- `CONCERTO_DASHBOARD_URL=https://bufet-dashboard.duckdns.org`

On Windows (PowerShell) in this folder:
```powershell
cd C:\bufet\deploy\home-windows
docker compose up -d --build
```

## 7) External checks (from LTE)
These must work from outside your home Wi-Fi:
- `https://bufet-api.duckdns.org/up` returns 200
- `https://bufet-dashboard.duckdns.org/pair` loads (SPA route)

If they don't:
- check router port forwarding
- check ISP blocking of 80/443
- check Windows firewall
- check DuckDNS points to your current public IP

## 8) Configure Player build (EAS Variables)
Set project env vars on EAS (production environment):
- `EXPO_PUBLIC_API_URL=https://bufet-api.duckdns.org`
- `EXPO_PUBLIC_ALLOW_HTTP=0`

Then build APK:
```bash
cd /Users/janiecee/Developer/Buffet/apps/bufet-media-player
pnpm dlx eas-cli build -p android --profile apk
```

## 9) NAT loopback / hairpin (common home issue)
Symptom:
- From LTE everything works.
- From the same home Wi-Fi (TV) `https://bufet-api.duckdns.org` fails.

Fix options:
1. Enable NAT loopback / hairpin NAT on the router.
2. Add local DNS override on the router:
   `bufet-api.duckdns.org -> 192.168.1.10`
   `bufet-dashboard.duckdns.org -> 192.168.1.10`
3. Temporary fallback: open Player `/setup` and use LAN URL (requires HTTP and `EXPO_PUBLIC_ALLOW_HTTP=1`).

