# UI-манифест: Section (секция страницы)

> Компонент: `frontend/src/components/ui/Section.tsx`

## Назначение
Обёртка любой горизонтальной секции страницы: задаёт вертикальные отступы, контейнер и фон.

## Анатомия

```
<Section id eyebrow title lead align background>
  [actions?]
  children (сетка карточек / контент)
</Section>
```

## Правила

1. Каждая секция имеет `id` для якорной навигации (`services`, `steps`, `cta`).
2. Заголовок секции — `<h2>`; внутри — только `<h3>`. Иерархия не ломается.
3. `eyebrow` — надзаголовок uppercase micro с `--c-cyan` или `--c-gold`.
4. Вертикальный отступ — всегда `--space-section`, не задаётся вручную.
5. Чередование фона: `--c-bg` → `--c-surface` → `--c-bg` … Не более двух подряд одинаковых плотных фонов.
6. Пустая секция не рендерится — нет «заглушек».

## Props

| Prop | Тип | Default |
|---|---|---|
| `id` | string | обязателен |
| `eyebrow` | string | — |
| `title` | string | — |
| `lead` | string | — |
| `align` | left / center | left |
| `background` | base / surface | base |
