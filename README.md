# Сотрудники

Веб-приложение со списком сотрудников: регистрация и вход по email, список с поиском по ФИО и
фильтром по отделу, добавление сотрудника.

**Стек:** React 19 + TypeScript + обычный CSS · Node.js + Express 5 + TypeScript · SQLite
(встроенный `node:sqlite`).

> Проект в разработке. Прогресс — в [`agents/roadmap.md`](agents/roadmap.md).

## Запуск

Нужен **Node.js 24+** (рекомендуется версия из [`.nvmrc`](.nvmrc)). Нативных модулей нет — ничего
компилировать не придётся.

```bash
npm install
npm run dev
```

Откройте http://localhost:5173. API работает на http://localhost:3000, клиент ходит к нему через
прокси Vite.

## Скрипты

| Команда             | Что делает                          |
| ------------------- | ----------------------------------- |
| `npm run dev`       | сервер и клиент в режиме разработки |
| `npm run build`     | production-сборка обоих пакетов     |
| `npm start`         | запуск собранного сервера           |
| `npm run lint`      | ESLint с проверкой типов            |
| `npm run format`    | Prettier                            |
| `npm run typecheck` | `tsc` по всем пакетам               |
| `npm test`          | тесты (Vitest) во всех пакетах      |

## Структура

```
client/    React-приложение (Vite)
server/    Express API + SQLite
shared/    zod-схемы и типы, общие для клиента и сервера
agents/    архитектура, roadmap, соглашения, ADR, дизайн-бриф
```

Ключевые решения с обоснованием:

- [Серверные сессии вместо JWT](agents/decisions/001-sessions-vs-jwt.md)
- [`node:sqlite` и SQL без ORM](agents/decisions/002-node-sqlite.md)
- [Поиск по ФИО с кириллицей и «ё»](agents/decisions/003-cyrillic-search.md)
- [Хеширование паролей через scrypt](agents/decisions/004-password-hashing.md)

## Качество кода

- TypeScript в strict-режиме, ESLint с правилами `strictTypeChecked`, Prettier.
- Pre-commit хук (Husky + lint-staged) проверяет изменённые файлы, commitlint следит за форматом
  [Conventional Commits](https://www.conventionalcommits.org/).
- GitHub Actions на каждый push: lint, format, typecheck, build.

## Использование ИИ

При выполнении задания использовался **Claude** (Anthropic) через **Claude Code**, модель
Claude Opus 5.5:

- разбор задания и планирование этапов, проектирование архитектуры и API;
- настройка инструментов (TypeScript, ESLint, Prettier, Husky, commitlint, CI);
- документация в `agents/` — в том числе как контекст для самого агента
  ([`CLAUDE.md`](CLAUDE.md));
- написание кода и тестов под моим ревью.

Дизайн интерфейса подготовлен в **Claude Design** по брифу
[`agents/design-brief.md`](agents/design-brief.md).

Все решения я проверял и могу объяснить; обоснования ключевых — в [`agents/decisions/`](agents/decisions/).
