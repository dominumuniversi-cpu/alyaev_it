# UI-манифест: Button

> Компонент: `frontend/src/components/ui/Button.tsx`  
> Зависимости: `--c-gold`, `--c-cyan`, `--radius-md`, `--dur-fast`, `--ease-out` (см. tokens.md)

## Назначение
Единственный компонент кнопки на сайте. Любая кликабельная кнопка — только через него.

## Анатомия

```
[icon-left?] [label] [icon-right?] [badge?]
```

## Варианты (variant)

| variant | Вид | Когда использовать | Ограничения |
|---|---|---|---|
| `primary` | фон `--c-gold`, текст `--c-bg`, hover `--c-gold-dim` | Главное действие секции (1 на экран) | Не более одной primary-кнопки в видимой области |
| `secondary` | прозрачный фон, граница `--c-border-strong`, текст `--c-text` | Второе действие рядом с primary | — |
| `ghost` | без фона, текст `--c-gold`, hover фон `--c-surface` | Действия в карточках, «Подробнее» | Не для навигации в шапке |
| `tech` | фон `--c-cyan` 12%, текст `--c-cyan`, граница `--c-cyan` 30% | Технические/AI действия | Не для продаж |
| `danger` | фон `--c-danger`, текст белый | Необратимые действия | Всегда + confirm-диалог |

## Размеры (size)

| size | height | padding-x | font-size |
|---|---|---|---|
| `sm` | 36px | 14px | `--text-small` |
| `md` (default) | 44px | 20px | `--text-body` |
| `lg` | 52px | 28px | `--text-body` (увеличенный) |

Требование доступности: минимальная высота 44px для кнопки на тач-устройстве (кроме inline-текст-ссылок).

## Состояния

| Состояние | Поведение |
|---|---|
| default | базовые стили варианта |
| hover | затемнение фона на 10% / подъём `--glow-gold` для primary |
| focus-visible | outline 2px `--c-cyan`, offset 2px |
| active | `transform: translateY(1px)` |
| disabled | opacity .45, `cursor: not-allowed`, `aria-disabled=true`, клик не выполняется |
| loading | спиннер 16px, текст остаётся, `disabled` на время запроса, `aria-busy=true` |

## Поведение

- Если передан `href` — рендерится как `<a>` (навигация). Если `onClick` — как `<button type="button">`.
- `type="submit"` только внутри `<form>`.
- Кнопка с иконкой без текста обязана иметь `aria-label`.
- Никаких `onClick` на `<div>`.

## Props

| Prop | Тип | Default | Описание |
|---|---|---|---|
| `variant` | primary / secondary / ghost / tech / danger | primary | — |
| `size` | sm / md / lg | md | — |
| `href` | string | — | Переход (рендер `<Link>`) |
| `onClick` | () => void | — | Действие |
| `loading` | boolean | false | Блокирует повторный клик |
| `disabled` | boolean | false | — |
| `iconLeft` / `iconRight` | ReactNode | — | Иконка 18px |
| `fullWidth` | boolean | false | На мобильных главная CTA растягивается |

## Примеры использования

- Hero: `primary lg` — «Обсудить проект»; `secondary lg` — «Посмотреть услуги».
- Карточка услуги: `ghost sm` — «Подробнее».
- Форма: `primary md fullWidth` — «Отправить заявку» (loading во время запроса).
- Админка: `secondary sm` — «Редактировать»; `danger sm` — «Удалить».

## Антипаттерны

- Две primary-кнопки рядом.
- `primary` для навигации в шапке (там — `ghost`/ссылка).
- Своя кнопка на `<div>` в обход компонента.
