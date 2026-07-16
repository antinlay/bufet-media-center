# BUFET Dashboard (Expo)

Запуск локально:

```bash
pnpm install
cd ../api && bundle install && yarn install && bin/rails db:migrate && bin/rails db:seed  # если нужно поднять данные
cd ../api && bin/dev  # API на 3000

pnpm --filter @bufet/dashboard start -- --web  # dashboard (web)
```

Переменные окружения:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Production (Railway API):

```
EXPO_PUBLIC_API_URL=https://bufet-media-center-production.up.railway.app
```

Сборка web:

```bash
pnpm --filter @bufet/dashboard build:web
```

Native-проект dashboard работает в режиме CNG и не хранится в Git. Для локальной iOS-сборки Expo создаст его из `app.json`:

```bash
npx expo prebuild --platform ios
npx expo run:ios
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
