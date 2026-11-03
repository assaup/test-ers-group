# Соглашения

## Код

- TypeScript strict, `any` запрещён; внешние данные (тело запроса, ответ API, env) проходят через
  zod или явную проверку.
- Импорты типов — `import type` (требует `verbatimModuleSyntax`).
- Именованные экспорты; `export default` только там, где его требует инструмент (конфиги).
- Функции и простые объекты вместо классов. Исключение — классы ошибок (`AppError`, `ApiError`).
- Комментарии объясняют «почему», а не «что». Язык комментариев и идентификаторов — английский.
- Тексты для пользователя — на русском.
- Форматирование не обсуждаем — его делает Prettier.

## Имена

| Что                      | Как               | Пример                        |
| ------------------------ | ----------------- | ----------------------------- |
| файлы сервера и утилит   | kebab-case + роль | `employees.repository.ts`     |
| React-компоненты         | PascalCase        | `EmployeeTable.tsx`           |
| хуки                     | camelCase с `use` | `useDebouncedValue.ts`        |
| CSS-классы               | BEM               | `employee-table__row--active` |
| CSS-переменные           | `--категория-имя` | `--color-accent`, `--space-4` |
| колонки БД               | snake_case        | `department_id`               |
| поля в JSON и TypeScript | camelCase         | `departmentId`                |

Перевод snake_case ↔ camelCase — только в репозиториях.

## Ошибки

- Сервер бросает `AppError(status, code, message, fields?)`; всё остальное error handler превращает в
  `500 INTERNAL_ERROR` без деталей в ответе и с логом в консоль.
- Клиент получает `ApiError` с теми же `code` и `fields`. Сообщения для пользователя выбираются по
  `code`, а не берутся из `message` сервера как есть.

## Безопасность

- SQL — только плейсхолдеры `?`, никакой конкатенации строк.
- Пароль и токен сессии не попадают ни в логи, ни в ответы API.
- Cookie `sid`: `httpOnly`, `SameSite=Lax`, `Secure` в production, `Path=/`.

## CSS

- Обычный CSS, без препроцессоров и CSS-in-JS. Файл стилей лежит рядом с компонентом и
  импортируется из него.
- Цвета, отступы, радиусы, тени, шрифты — только через переменные из `styles/tokens.css`.
- Mobile-first, контрольные ширины 360 / 768 / 1200 px.
- Фокус всегда виден (`:focus-visible`), контраст текста не ниже WCAG AA.

## Тесты

- Файлы `*.test.ts(x)` рядом с кодом или в `tests/` пакета.
- Имя теста описывает поведение: `returns 401 without session cookie`.
- Серверные тесты не мокают БД — используют настоящий SQLite `:memory:`.

## Коммиты

[Conventional Commits](https://www.conventionalcommits.org/), проверяет commitlint:

```
<type>(<scope>): <краткое описание в повелительном наклонении, по-английски>
```

- **type:** `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`, `ci`, `build`, `perf`
- **scope** (необязательно): `client`, `server`, `shared`, `db`, `auth`, `deps`, `ci`
- Один коммит — одно логическое изменение. Код, тесты к нему и галочка в roadmap — вместе.

Примеры: `feat(auth): add session-based login`, `test(server): cover cyrillic search`,
`docs: describe architecture`.
