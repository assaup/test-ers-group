# Дизайн

Макеты подготовлены в **Claude Design** по брифу [`agents/design-brief.md`](../agents/design-brief.md).

- [`employees-directory.dc.html`](employees-directory.dc.html) — исходник макета: токены, компоненты,
  экраны входа, регистрации, списка (1200 / 768 / 360 px), добавления сотрудника и тёмной темы.
  Открывается в Claude Design; рантайм для просмотра вне его в репозиторий не включён.
- [`preview.webp`](preview.webp) — превью.

Как дизайн перенесён в код:

| В макете                          | В коде                                                            |
| --------------------------------- | ----------------------------------------------------------------- |
| блок `tokens.css`                 | [`client/src/styles/tokens.css`](../client/src/styles/tokens.css) |
| кнопки, поля, уведомление, ошибка | `client/src/components/ui/*`                                      |
| метки отделов                     | `client/src/components/DepartmentBadge.*`                         |
| экраны 03–08                      | `client/src/pages/*`                                              |

Отличия от макета:

- демо-аккаунт — `demo@example.com`, а не `demo@company.ru`: домен `example.com` зарезервирован
  для примеров и гарантированно никому не принадлежит;
- таблица превращается в карточки на ширине меньше 640 px (в макете — 360 px).
