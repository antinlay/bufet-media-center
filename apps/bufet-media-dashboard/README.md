# BUFET Dashboard (Expo)

Запуск локально:

```bash
pnpm install
pnpm --filter @bufet/api db:migrate && pnpm --filter @bufet/api db:seed  # если нужно поднять данные
pnpm --filter @bufet/api dev  # API на 3001

pnpm --filter @bufet/dashboard start -- --web  # dashboard (web)
```

Переменные окружения:

```
EXPO_PUBLIC_API_URL=http://localhost:3001
```

Production (Railway API):

```
EXPO_PUBLIC_API_URL=https://bufet-media-center-production.up.railway.app
```

Сборка web:

```bash
pnpm --filter @bufet/dashboard build:web
```

Деплой dashboard на Railway:
- Создай отдельный service для dashboard.
- `Root Directory`: `/`
- `Builder`: Dockerfile
- `Dockerfile Path`: `apps/bufet-media-dashboard/Dockerfile`
- Variable: `EXPO_PUBLIC_API_URL=https://bufet-media-center-production.up.railway.app`
- `Custom Build Command`, `Pre-deploy Command`, `Custom Start Command`: пусто.

Основные экраны:
- /login, /register — аутентификация
- /pair — привязка устройства по коду (поддержка ?code=)
- /devices — список устройств, переименование, переход в детали
- /devices/[id] — назначение плейлиста устройству
- /playlists — создание плейлистов и добавление элементов
