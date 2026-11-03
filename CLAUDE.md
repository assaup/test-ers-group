# CLAUDE.md

Тестовое задание «Список сотрудников»: React + TypeScript (обычный CSS) / Express + TypeScript /
SQLite. Подробный контекст — в [`agents/`](agents/README.md).

## Перед работой

- Текущий этап и его пункты — [`agents/roadmap.md`](agents/roadmap.md).
- Схема БД, API, слои — [`agents/architecture.md`](agents/architecture.md).
- Стиль кода, имена, коммиты — [`agents/conventions.md`](agents/conventions.md).
- Почему так устроено — [`agents/decisions/`](agents/decisions/).

## Жёсткие правила

- Стек задан заданием и не меняется: никаких UI-библиотек, CSS-фреймворков и ORM.
- Нативные npm-модули не добавлять (ADR 002, 004). SQLite — через `node:sqlite`.
- SQL — только с плейсхолдерами `?` и только в `*.repository.ts`.
- Все маршруты `/api/*`, кроме `auth/register`, `auth/login` и `health`, — под `requireAuth`.
- Валидация входных данных — zod-схемами из `shared`, одинаковыми на клиенте и сервере.
- Пароли и токены не логировать и не возвращать в ответах.
- Код и комментарии — по-английски, тексты интерфейса — по-русски.

## Команды

```bash
npm run dev          # сервер :3000 + клиент :5173
npm run lint         # ESLint с проверкой типов
npm run typecheck
npm run build
npm run format
```

## Коммиты

- Conventional Commits, проверяет commitlint: `feat(server): …`, `fix(client): …`, `docs: …`.
- Галочки в `agents/roadmap.md` — в том же коммите, что и код.
