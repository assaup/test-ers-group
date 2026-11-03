# Roadmap

Отмечаем пункты тем же коммитом, что и код. Формат коммитов — в [conventions.md](conventions.md).

## 1. Каркас и инструменты ✅

- [x] npm workspaces: `client`, `server`
- [x] TypeScript strict, общий `tsconfig.base.json`
- [x] ESLint (type-checked) + Prettier
- [x] Husky + lint-staged + commitlint (Conventional Commits)
- [x] GitHub Actions: lint, format, typecheck, build

## 2. Контекст для агентов ✅

- [x] `agents/`: architecture, roadmap, conventions, design-brief
- [x] ADR 001–004
- [x] `CLAUDE.md`
- [x] README: запуск, скрипты, раздел про ИИ

## 3. Сервер: БД и сид

- [ ] пакет `shared`: zod-схемы, `normalizeForSearch`
- [ ] `db/connection.ts`: `node:sqlite`, WAL, foreign keys, путь из `DB_PATH`
- [ ] миграции + таблица `migrations`
- [ ] идемпотентный сид: отделы, 5 сотрудников, демо-пользователь
- [ ] `createApp({ db })`, `AppError`, единый error handler

## 4. Сервер: авторизация

- [ ] хеширование паролей (scrypt), генерация и хеш токена сессии
- [ ] `register`, `login`, `logout`, `me`
- [ ] `requireAuth`, httpOnly-cookie `sid`
- [ ] rate limit на `/api/auth/*`, helmet
- [ ] очистка просроченных сессий

## 5. Сервер: сотрудники

- [ ] `GET /api/departments`
- [ ] `GET /api/employees` с `search` и `departmentId`
- [ ] `POST /api/employees` с проверкой отдела

## 6. Сервер: тесты

- [ ] Vitest + supertest, база `:memory:`
- [ ] auth: успех, дубль email, неверный пароль, logout инвалидирует сессию
- [ ] 401 на всех защищённых маршрутах
- [ ] сотрудники: поиск (кириллица, регистр, `ё`), фильтр, валидация, создание
- [ ] тесты в CI

## 7. Дизайн (Claude Design)

- [ ] прогнать [design-brief.md](design-brief.md) через Claude Design
- [ ] перенести токены в `client/src/styles/tokens.css`
- [ ] зафиксировать компоненты и состояния

## 8. Клиент: каркас и авторизация

- [ ] React Router, `AuthProvider`, `RequireAuth`
- [ ] `api/client.ts` с `ApiError` и обработкой 401
- [ ] страницы входа и регистрации с валидацией

## 9. Клиент: сотрудники

- [ ] таблица сотрудников + состояния загрузки / пусто / ошибка
- [ ] поиск с debounce, фильтр по отделу, синхронизация с URL
- [ ] форма добавления с валидацией и ошибками сервера
- [ ] выход из аккаунта

## 10. Доводка

- [ ] адаптивность (таблица → карточки на узком экране)
- [ ] доступность: фокус, подписи полей, `aria-live` для ошибок
- [ ] Express отдаёт `client/dist` в production (`npm start`)
- [ ] тесты клиента; e2e Playwright — по времени

## 11. Сдача

- [ ] README: финальная инструкция, демо-доступ, раздел про ИИ
- [ ] чистый прогон с нуля: `git clone` → `npm install` → `npm run build && npm start`
- [ ] push, ссылка на репозиторий

## Возможное развитие (не делаем)

Пагинация и сортировка списка, редактирование и удаление сотрудников, роли, CSRF-токен поверх
`SameSite`, Docker.
