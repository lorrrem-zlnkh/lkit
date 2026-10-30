# Lkit → Atomic RD: спека недостающих компонентов

Компоненты ниже реализованы в Lkit, но отсутствуют в Atomic RD.
Каждый написан на ARD-токенах и готов к переносу в систему.

---

## lk-resource-card — Карточка ресурса каталога

**Атомарный уровень:** Organism  
**Использование:** каталог инструментов, витрина продуктов

### HTML-структура
```html
<a class="lk-resource-card" href="…" target="_blank" rel="noreferrer">
  <!-- Обложка (скрыта, если нет скриншота) -->
  <img class="lk-resource-card__cover" alt="" hidden />
  <!-- Эмодзи-аватар (показывается вместо обложки) -->
  <span class="lk-emoji-badge">🎨</span>
  <!-- Контент -->
  <h2 class="lk-resource-card__title">Название ресурса</h2>
  <p class="lk-resource-card__meta" hidden>Метка</p>
  <p class="lk-resource-card__desc">Описание ресурса в 1–2 предложения.</p>
</a>
```

### CSS
```css
.lk-resource-card {
  display: grid;
  gap: 14px;
  align-content: start;
  min-height: 220px;
  padding: 16px;
  border-radius: var(--r-card);          /* --ard-r-lg */
  border: 1px solid var(--line);
  background: linear-gradient(180deg, var(--card), #131922);
  box-shadow: var(--ard-elev-1);
  text-decoration: none;
  color: var(--ink);
  transition:
    transform        var(--ard-dur-short) var(--ard-ease-standard),
    border-color     var(--ard-dur-short) var(--ard-ease-standard),
    background-color var(--ard-dur-short) var(--ard-ease-standard);
}
.lk-resource-card:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong, rgba(255,255,255,.16));
  background: linear-gradient(180deg, #1c2430, #18202a);
}
.lk-resource-card__cover {
  width: 100%;
  aspect-ratio: 1.45;
  object-fit: cover;
  border-radius: var(--ard-r-md);
  border: 1px solid var(--line);
  background: rgba(255,255,255,.03);
}
.lk-resource-card__title {
  margin: 0;
  font-size: 21px;
  line-height: 1.05;
  letter-spacing: -0.03em;
}
.lk-resource-card__meta {
  margin: -4px 0 0;
  color: var(--muted);
  font: 500 12px/1.4 var(--mono, monospace);
}
.lk-resource-card__desc {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}
```

---

## lk-emoji-badge — Эмодзи-аватар

**Атомарный уровень:** Atom  
**Использование:** аватар ресурса без скриншота, маркер рубрики

### HTML
```html
<span class="lk-emoji-badge">🎨</span>
<!-- Размер sm (34px) -->
<span class="lk-emoji-badge lk-emoji-badge--sm">📰</span>
```

### CSS
```css
.lk-emoji-badge {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: var(--ard-r-full);
  display: grid;
  place-items: center;
  background: rgba(255,255,255,.06);
  border: 1px solid var(--line);
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  font-size: 24px;
  line-height: 1;
}
.lk-emoji-badge--sm {
  width: 34px;
  height: 34px;
  font-size: 16px;
}
```

---

## lk-rubric-btn — Кнопка навигации по рубрикам

**Атомарный уровень:** Molecule  
**Использование:** боковая навигация каталога; варианты — catalog, dict, link

### HTML
```html
<!-- Каталог -->
<button type="button" class="lk-rubric-btn" data-active="true">
  <span class="lk-rubric-btn__label">Инструменты</span>
  <strong class="lk-rubric-btn__count">120</strong>
</button>

<!-- Словарь -->
<button type="button" class="lk-rubric-btn lk-rubric-btn--dict">
  <span class="lk-rubric-btn__label">IT-словарь</span>
  <strong class="lk-rubric-btn__count">659</strong>
</button>

<!-- Внешняя ссылка -->
<a class="lk-rubric-btn lk-rubric-btn--link" href="…" target="_blank" rel="noreferrer">
  <span class="lk-rubric-btn__label">Блог о дизайне</span>
  <span class="lk-emoji-badge lk-emoji-badge--sm">📰</span>
</a>
```

### CSS
```css
.lk-rubric-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid transparent;
  border-radius: var(--ard-r-md);
  padding: 14px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  text-decoration: none;
  transition:
    background-color var(--ard-dur-short) var(--ard-ease-standard),
    border-color     var(--ard-dur-short) var(--ard-ease-standard);
}
.lk-rubric-btn__label {
  text-align: left;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.lk-rubric-btn__count {
  font: 500 12px/1.2 var(--mono, monospace);
  color: var(--muted);
}
.lk-rubric-btn:hover {
  background: var(--ard-state-hover);
  border-color: var(--line);
}
.lk-rubric-btn[data-active="true"] {
  background: linear-gradient(135deg,
    rgba(125,211,252,.18), rgba(96,165,250,.08));
  border-color: rgba(125,211,252,.34);
}
/* Dict-вариант: фиолетовый акцент */
.lk-rubric-btn--dict[data-active="true"] {
  background: linear-gradient(135deg,
    rgba(167,139,250,.18), rgba(139,92,246,.08));
  border-color: rgba(167,139,250,.34);
}
/* Разделитель перед словарём */
.lk-rubric-btn--dict {
  margin-top: 8px;
  position: relative;
}
.lk-rubric-btn--dict::before {
  content: "";
  position: absolute;
  top: -16px; left: 0; right: 0;
  height: 1px;
  background: var(--line);
}
```

---

## lk-filter-chip — Фильтр-чип с каунтером

**Атомарный уровень:** Molecule  
**Использование:** горизонтальная строка фильтров по подрубрике

> Отличие от ARD `.chip`: имеет счётчик справа, pill-форма, активное состояние с градиентом.

### HTML
```html
<button type="button" class="lk-filter-chip" data-active="false">
  <span class="lk-filter-chip__label">Figma-плагины</span>
  <strong class="lk-filter-chip__count">42</strong>
</button>
```

### CSS
```css
.lk-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  border: 1px solid var(--line);
  border-radius: var(--ard-r-full);
  padding: 10px 14px;
  background: rgba(255,255,255,.03);
  color: var(--ink);
  cursor: pointer;
  transition:
    background-color var(--ard-dur-short) var(--ard-ease-standard),
    border-color     var(--ard-dur-short) var(--ard-ease-standard);
}
.lk-filter-chip__label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.lk-filter-chip__count {
  color: var(--muted);
  font: 500 11px/1.2 var(--mono, monospace);
}
.lk-filter-chip:hover {
  background: var(--ard-state-focus);
  border-color: rgba(255,255,255,.16);
}
.lk-filter-chip[data-active="true"] {
  background: linear-gradient(135deg,
    rgba(125,211,252,.18), rgba(96,165,250,.08));
  border-color: rgba(125,211,252,.34);
}
```

---

## lk-dict-term — Строка словаря

**Атомарный уровень:** Organism  
**Использование:** IT-словарь, одна запись

### HTML
```html
<div class="lk-dict-term" id="dict-807">
  <div class="lk-dict-term__header">
    <span class="lk-dict-term__title">Оверхед</span>
    <button type="button" class="lk-share-btn" title="Скопировать ссылку">
      <!-- 12px SVG link icon -->
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    </button>
  </div>
  <p class="lk-dict-term__def">
    Дополнительные ресурсы (процессорное время, память, трафик), которые
    система тратит на служебные нужды помимо полезной работы.
    <a class="lk-dict-term__source" href="…" target="_blank">Источник</a>
  </p>
</div>
```

### CSS
```css
.lk-dict-term {
  display: grid;
  gap: 6px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  scroll-margin-top: 80px;
}
.lk-dict-term__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.lk-dict-term__title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
}
.lk-dict-term__def {
  margin: 0;
  color: var(--ink);
  font-size: 15px;
  line-height: 1.7;
  opacity: .85;
}
.lk-dict-term__source {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
  white-space: nowrap;
}

/* Highlight-анимация при переходе по #hash */
.lk-dict-term--highlight {
  border-radius: var(--ard-r-md);
  padding: 14px 16px;
  margin: 0 -16px;
  animation: lk-dict-flash 2s var(--ard-ease-standard) forwards;
}
@keyframes lk-dict-flash {
  0%   { background: rgba(167,139,250,.28); box-shadow: 0 0 0 1px rgba(167,139,250,.45); }
  100% { background: rgba(167,139,250,0);   box-shadow: 0 0 0 1px rgba(167,139,250,0);   }
}
```

---

## lk-share-btn — Кнопка копирования ссылки

**Атомарный уровень:** Atom  
**Использование:** ссылка на термин словаря, любая «скопировать»-кнопка

> Расширяет ARD `.icon-btn` — добавляет начальную прозрачность и reveal при наведении на родителя.

### HTML
```html
<button type="button" class="lk-share-btn" title="Скопировать ссылку">
  <!-- 12px SVG link icon -->
</button>
```

### CSS
```css
.lk-share-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: var(--ard-r-xs);   /* 8px */
  padding: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  line-height: 0;
  opacity: 0;
  transition:
    color        var(--ard-dur-short),
    border-color var(--ard-dur-short),
    background   var(--ard-dur-short),
    opacity      var(--ard-dur-short);
}
/* Reveal при наведении на родительский элемент */
.lk-dict-term:hover .lk-share-btn { opacity: 1; }

.lk-share-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft, rgba(125,211,252,.12));
}
```

---

## Сводная таблица

| Компонент          | Уровень    | Готово к ARD | Приоритет |
|--------------------|------------|:------------:|-----------|
| lk-emoji-badge     | Atom       | ✅           | Высокий   |
| lk-share-btn       | Atom       | ✅           | Средний   |
| lk-filter-chip     | Molecule   | ✅           | Высокий   |
| lk-rubric-btn      | Molecule   | ✅           | Высокий   |
| lk-resource-card   | Organism   | ✅           | Высокий   |
| lk-dict-term       | Organism   | ✅           | Средний   |

**Не вошло в спеку (уже есть в ARD или решается лейаутом):**
- `.app-layout` — двухколоночный грид, решается ARD Resizable Panels / Frame
- `.sidebar` — боковая панель, решается ARD Sheet / Navigation
- `.mobile-topbar` + bottom-sheet — решается ARD Sheet
