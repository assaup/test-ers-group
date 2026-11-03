# Архитектура

## Пакеты

npm workspaces, три пакета:

```
test-ers/
├─ client/   @test-ers/client  — React 19 + TypeScript + Vite, обычный CSS
├─ server/   @test-ers/server  — Express 5 + TypeScript, SQLite через node:sqlite
└─ shared/   @test-ers/shared  — zod-схемы и типы, общие для клиента и сервера
```

`shared` подключается исходниками (`exports` указывает на `src/index.ts`): Vite и tsx понимают
TypeScript сами, а production-сборка сервера (tsup) вшивает `shared` в бандл.

## Запуск

| Режим      | Как                          | Что происходит                                               |
| ---------- | ---------------------------- | ------------------------------------------------------------ |
| Разработка | `npm run dev`                | сервер на :3000 (`tsx watch`), Vite на :5173 с прокси `/api` |
| Production | `npm run build && npm start` | Express отдаёт API и собранный `client/dist` с одного порта  |

В обоих режимах браузер видит клиент и API на одном origin, поэтому CORS не нужен, а cookie сессии
работает с `SameSite=Lax`.

## База данных

Файл SQLite: `server/data/app.db` (путь переопределяется `DB_PATH`). При старте:
`PRAGMA journal_mode = WAL`, `PRAGMA foreign_keys = ON`, затем миграции, затем сид.

```sql
users (
  id            INTEGER PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,     -- хранится в нижнем регистре
  password_hash TEXT NOT NULL,            -- scrypt, см. ADR 004
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
)

sessions (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,        -- sha256 от токена из cookie, см. ADR 001
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)

departments (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
)

employees (
  id               INTEGER PRIMARY KEY,
  full_name        TEXT NOT NULL,
  full_name_search TEXT NOT NULL,         -- нормализованное ФИО для поиска, см. ADR 003
  position         TEXT NOT NULL,
  department_id    INTEGER NOT NULL REFERENCES departments(id),
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
)
-- индексы: employees(department_id), employees(full_name_search), sessions(expires_at)
```

**Миграции** — массив `{ id, sql }` в `server/src/db/migrations.ts`, применённые записываются в
таблицу `migrations`. Массив, а не `.sql`-файлы, чтобы миграции попадали в бандл без копирования.

**Сид** — идемпотентный: отделы вставляются через `INSERT OR IGNORE`, 5 демо-сотрудников только если
таблица `employees` пуста, демо-пользователь `demo@example.com` только если его нет.

## API

Все ответы — JSON. Ошибки в одном формате:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "fields": { "email": "…" } } }
```

| Метод | Путь                 | Auth | Тело / параметры                       | Ответ                   |
| ----- | -------------------- | ---- | -------------------------------------- | ----------------------- |
| POST  | `/api/auth/register` | —    | `{ email, password }`                  | 201 `{ user }` + cookie |
| POST  | `/api/auth/login`    | —    | `{ email, password }`                  | 200 `{ user }` + cookie |
| POST  | `/api/auth/logout`   | да   | —                                      | 204, cookie очищена     |
| GET   | `/api/auth/me`       | да   | —                                      | 200 `{ user }`          |
| GET   | `/api/departments`   | да   | —                                      | 200 `{ items }`         |
| GET   | `/api/employees`     | да   | `?search=строка&departmentId=число`    | 200 `{ items }`         |
| POST  | `/api/employees`     | да   | `{ fullName, position, departmentId }` | 201 `{ employee }`      |
| GET   | `/api/health`        | —    | —                                      | 200 `{ status: "ok" }`  |

Коды ошибок: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `401 INVALID_CREDENTIALS`,
`409 EMAIL_TAKEN`, `429 TOO_MANY_REQUESTS`, `500 INTERNAL_ERROR`.

Детали поведения:

- Регистрация сразу логинит пользователя.
- Неверный email и неверный пароль дают одинаковый ответ `INVALID_CREDENTIALS`; при несуществующем
  email всё равно выполняется хеширование, чтобы время ответа не выдавало, есть ли такой пользователь.
- `/api/auth/*` (кроме `me`) под rate limit.
- Список сотрудников сортируется по ФИО. Пагинации нет — для задания не нужна, отмечено как развитие.
- `departmentId` несуществующего отдела при создании → `400 VALIDATION_ERROR` с ошибкой у поля.

## Сервер: слои

```
server/src/
├─ index.ts              точка входа: открыть БД, migrate, seed, listen
├─ app.ts                createApp({ db }) — сборка Express; без listen, удобно для supertest
├─ config.ts             переменные окружения с дефолтами
├─ db/                   connection.ts, migrations.ts, migrate.ts, seed.ts
├─ lib/                  errors.ts (AppError), password.ts (scrypt), session-token.ts
├─ middleware/           require-auth.ts, validate.ts, error-handler.ts
└─ modules/
   ├─ auth/              auth.router.ts → auth.service.ts → users.repository.ts, sessions.repository.ts
   ├─ departments/       departments.router.ts → departments.repository.ts
   └─ employees/         employees.router.ts → employees.service.ts → employees.repository.ts
```

- **router** — HTTP: разбор запроса, валидация через zod из `shared`, статус ответа.
- **service** — бизнес-правила (хеширование, создание сессии, проверка отдела). Не знает про `req`/`res`.
- **repository** — только SQL, только параметризованные запросы. Возвращает доменные объекты в camelCase.

Зависимости (БД) передаются в `createApp` явно: в тестах подставляется `:memory:`.

Поток запроса `GET /api/employees?search=иван`:

```
cookie sid ─► requireAuth ─► sha256(token) ─► sessions JOIN users ─► req.user
          ─► validate(query) ─► employeesService.list ─► repository: LIKE по full_name_search
          ─► 200 { items }
```

## Клиент

```
client/src/
├─ main.tsx, App.tsx     роутинг
├─ api/                  client.ts (fetch-обёртка, ApiError), auth.ts, employees.ts
├─ auth/                 AuthProvider.tsx, useAuth.ts, RequireAuth.tsx
├─ pages/                LoginPage, RegisterPage, EmployeesPage
├─ components/           EmployeeTable, EmployeeFilters, AddEmployeeDialog, ui/*
├─ hooks/                useDebouncedValue.ts, useEmployees.ts
└─ styles/               tokens.css (дизайн-токены), base.css
```

- Маршруты: `/login`, `/register`, `/employees` (под `RequireAuth`), `/` → редирект.
- `AuthProvider` при старте зовёт `/api/auth/me`; статус `loading | authenticated | anonymous`.
  Любой ответ 401 от API переводит в `anonymous` и уводит на `/login`.
- Данные грузятся своими хуками с `AbortController` — отменяют устаревший запрос при быстром вводе.
  Библиотека вроде TanStack Query для двух эндпоинтов не окупается.
- Поиск с задержкой 300 мс; поиск и фильтр живут в URL (`?q=…&dept=…`) — переживают перезагрузку
  и ими можно поделиться.
- Формы: контролируемые компоненты + те же zod-схемы, что на сервере (`safeParse` → ошибки по полям).
  Ошибки сервера по полям (`fields`) показываются там же.
- CSS: обычные `.css`-файлы рядом с компонентами, BEM-имена, все цвета/отступы через переменные из
  `tokens.css`.

## Тесты

- **server** — Vitest + supertest на `createApp` с базой `:memory:`: регистрация/вход/выход, 401 без
  сессии на всех защищённых маршрутах, валидация, поиск по кириллице и `ё`, фильтр по отделу.
- **client** — Vitest + Testing Library: валидация формы, поведение поиска.
- **e2e** (по времени) — один сценарий Playwright: регистрация → поиск → добавление.
