# Сотрудники

Веб-приложение со списком сотрудников: React + TypeScript на клиенте, Express + TypeScript на сервере, SQLite.

## Запуск

Нужен Node.js 22+ (рекомендуется версия из `.nvmrc`).

```bash
npm install
npm run dev
```

Клиент: http://localhost:5173, API: http://localhost:3000.

## Скрипты

| Команда             | Что делает                          |
| ------------------- | ----------------------------------- |
| `npm run dev`       | сервер и клиент в режиме разработки |
| `npm run build`     | production-сборка обоих пакетов     |
| `npm run lint`      | ESLint с проверкой типов            |
| `npm run format`    | Prettier                            |
| `npm run typecheck` | `tsc` по всем пакетам               |
