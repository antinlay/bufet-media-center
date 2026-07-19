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
EXPO_PUBLIC_SUPABASE_URL=https://illaavmcrawkjfnvnqfo.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Авторизация dashboard работает через Supabase Auth с email/password. Для production включите подтверждение email в Supabase Authentication и добавьте в Redirect URLs:

```text
https://bufet-media-center.vercel.app/reset-password
bufetdash://reset-password
```

Production (Render API):

```
EXPO_PUBLIC_API_URL=https://bufet-media-api.onrender.com
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

Деплой dashboard выполняется на Vercel из корневого `vercel.json`. Rails API разворачивается отдельно через корневой `render.yaml`.

Основные экраны:
- /login, /register — аутентификация
- /pair — привязка устройства по коду (поддержка ?code=)
- /devices — список устройств, переименование, переход в детали
- /devices/[id] — назначение плейлиста устройству
- /playlists — создание плейлистов и добавление элементов
