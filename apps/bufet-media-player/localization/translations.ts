const en = {
  brand: {
    name: 'Bufet Player',
  },
  common: {
    api: 'API',
    cancel: 'Cancel',
    loading: 'loading',
    none: 'none',
    notResolved: 'not resolved',
    openDiagnostics: 'Open diagnostics',
    openSetup: 'Open setup',
    retry: 'Retry',
    unknown: 'unknown',
    unknownError: 'An unknown error occurred',
    unset: 'unset',
  },
  loading: {
    apiUnavailable: 'The API is unavailable. Opening setup…',
    initializing: 'Initializing Bufet Player…',
  },
  pairing: {
    code: 'Pairing code: %{code}',
    createFailed: 'Could not create a pairing code',
    creating: 'Creating a pairing code…',
    subtitle: 'Scan the QR code or open the URL below',
    title: 'Pair your device',
    waiting: 'Waiting for pairing confirmation…',
  },
  setup: {
    checkingApi: 'Checking the API…',
    clearSaved: 'Clear saved URL',
    configuredApiUrl: 'Configured API URL',
    deviceInitializationFailed: 'Could not initialize the device',
    discoveryCancelled: 'Discovery cancelled.',
    noApiFound: 'No API was found. Check the network and select Refresh again.',
    ready: 'Ready: %{url}',
    refresh: 'Refresh',
    savedApiUrl: 'Saved API URL',
    scanning: 'Scanning: %{done}/%{total}',
    title: 'Bufet Player setup',
    urlCleared: 'The saved URL was cleared.',
  },
  diagnostics: {
    body: 'Response body',
    cachedBaseUrl: 'Cached base URL',
    checksFailed: 'Could not complete diagnostics',
    configuredApiUrl: 'Configured API URL',
    connected: 'connected',
    deviceId: 'Device ID',
    envApiUrl: 'Environment API URL',
    fail: 'FAIL',
    goToSetup: 'Go to setup',
    internet: 'internet',
    ipAddress: 'IP address',
    lastError: 'Last error',
    network: 'Network',
    ok: 'OK',
    probe: 'API probe',
    probeNetworkError: 'Network error',
    probeTimeout: 'Request timed out',
    probeUnexpectedResponse: 'Unexpected API response',
    runChecks: 'Run checks',
    savedBaseUrl: 'Saved base URL',
    title: 'Diagnostics',
  },
  player: {
    emptySubtitle: 'Assign a playlist in the dashboard',
    emptyTitle: 'No content assigned',
    playlistLoadFailed: 'Could not load the playlist',
  },
} as const;

type TranslationShape<T> = {
  [Key in keyof T]: T[Key] extends string ? string : TranslationShape<T[Key]>;
};

const ru: TranslationShape<typeof en> = {
  brand: {
    name: 'Буфет Проигрыватель',
  },
  common: {
    api: 'API',
    cancel: 'Отмена',
    loading: 'загрузка',
    none: 'нет',
    notResolved: 'не определён',
    openDiagnostics: 'Открыть диагностику',
    openSetup: 'Открыть настройки',
    retry: 'Повторить',
    unknown: 'неизвестно',
    unknownError: 'Произошла неизвестная ошибка',
    unset: 'не задан',
  },
  loading: {
    apiUnavailable: 'API недоступен. Открываем настройки…',
    initializing: 'Запускаем Буфет Проигрыватель…',
  },
  pairing: {
    code: 'Код подключения: %{code}',
    createFailed: 'Не удалось создать код подключения',
    creating: 'Создаём код подключения…',
    subtitle: 'Отсканируйте QR-код или откройте ссылку ниже',
    title: 'Подключите устройство',
    waiting: 'Ожидаем подтверждение подключения…',
  },
  setup: {
    checkingApi: 'Проверяем API…',
    clearSaved: 'Очистить сохранённый URL',
    configuredApiUrl: 'Настроенный URL API',
    deviceInitializationFailed: 'Не удалось инициализировать устройство',
    discoveryCancelled: 'Поиск отменён.',
    noApiFound: 'API не найден. Проверьте сеть и снова нажмите «Обновить».',
    ready: 'Готово: %{url}',
    refresh: 'Обновить',
    savedApiUrl: 'Сохранённый URL API',
    scanning: 'Проверено: %{done}/%{total}',
    title: 'Настройка Буфет Проигрывателя',
    urlCleared: 'Сохранённый URL очищен.',
  },
  diagnostics: {
    body: 'Тело ответа',
    cachedBaseUrl: 'URL API в кэше',
    checksFailed: 'Не удалось выполнить диагностику',
    configuredApiUrl: 'Настроенный URL API',
    connected: 'подключение',
    deviceId: 'ID устройства',
    envApiUrl: 'URL API из окружения',
    fail: 'ОШИБКА',
    goToSetup: 'Перейти к настройкам',
    internet: 'интернет',
    ipAddress: 'IP-адрес',
    lastError: 'Последняя ошибка',
    network: 'Сеть',
    ok: 'ГОТОВО',
    probe: 'Проверка API',
    probeNetworkError: 'Ошибка сети',
    probeTimeout: 'Время ожидания истекло',
    probeUnexpectedResponse: 'Неожиданный ответ API',
    runChecks: 'Запустить проверку',
    savedBaseUrl: 'Сохранённый URL API',
    title: 'Диагностика',
  },
  player: {
    emptySubtitle: 'Назначьте плейлист в кабинете',
    emptyTitle: 'Нет назначенного контента',
    playlistLoadFailed: 'Не удалось загрузить плейлист',
  },
};

type NestedKey<T> = {
  [Key in keyof T & string]: T[Key] extends string
    ? Key
    : T[Key] extends Record<string, unknown>
      ? `${Key}.${NestedKey<T[Key]>}`
      : never;
}[keyof T & string];

export type PlayerLanguage = 'en' | 'ru';
export type TranslationKey = NestedKey<typeof en>;

export const translations = { en, ru };
