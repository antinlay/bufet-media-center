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

Основные экраны:
- /login, /register — аутентификация
- /pair — привязка устройства по коду (поддержка ?code=)
- /devices — список устройств, переименование, переход в детали
- /devices/[id] — назначение плейлиста устройству
- /playlists — создание плейлистов и добавление элементов
