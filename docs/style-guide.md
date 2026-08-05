# UI Style Guide

Design language used across this application. Follow these rules when building new pages or components.

---

## Color Palette

### Neutrals (base of every surface)

| Token | Hex | Use |
|---|---|---|
| `#1a1a1a` | Near-black | Primary text, headings |
| `#6b6b6b` | Mid-grey | Secondary text, nav items, labels |
| `#9a9a96` | Muted grey | Tertiary text, placeholder, section headers |
| `#c4c4c0` | Light grey | Placeholder text inside inputs |
| `#EDEDEA` | Border grey | All dividers, card borders, table borders |
| `#F3F2EF` | Off-white | Hover backgrounds, skeleton loaders, tag chips |
| `#F8F8F6` | Table header bg | Sticky `<thead>` background |
| `#FFFFFF` | White | Cards, sidebar, form surfaces |

### Brand (action + active state)

| Token | Hex | Use |
|---|---|---|
| `#4A5FD4` | Indigo | Active nav item text, focus rings, primary buttons |
| `#EEF2FF` | Indigo tint | Active nav item background |

### Semantic status colours

Each status has a foreground + background pair. Always use them together.

| Status | BG | Text | Use |
|---|---|---|---|
| Success / Active | `#ECFDF5` | `#065F46` | ≤7 days active, completed states |
| Warning | `#FEF9C3` | `#92400E` | 7–30 days inactive, caution states |
| Error / Inactive | `#FEF2F2` | `#991B1B` | >30 days inactive, critical states |
| Destructive action | `#FEF2F2` | `#EF4444` | Delete hover, error messages |
| Neutral / Unknown | `#F3F2EF` | `#6b6b6b` | "Never signed in", unknown states |

---

## Typography

- Base font size: `text-sm` (14px) for all body copy
- Page headings: `text-lg font-semibold text-[#1a1a1a]`
- Section/table labels: `text-xs font-semibold text-[#9a9a96] uppercase tracking-wider`
- Sub-labels / helper text: `text-xs text-[#9a9a96]`
- Primary content in tables: `font-medium text-[#1a1a1a]`
- Secondary content in tables: `text-xs text-[#9a9a96]`

---

## Layout

### Page structure (full-height with nav)

```
<div class="flex h-full w-full">
  <GlobalNav />                          <!-- fixed 200px sidebar -->
  <div class="flex-1 min-w-0 overflow-y-auto h-full">
    {children}
  </div>
</div>
```

### Page internals

```
<div class="flex flex-col h-full">
  <!-- Header: title + action button -->
  <div class="px-6 pt-6 pb-4 border-b border-[#EDEDEA] bg-white">

  <!-- Summary tiles -->
  <div class="px-6 py-4 grid grid-cols-N gap-3 bg-white border-b border-[#EDEDEA]">

  <!-- Filters bar -->
  <div class="px-6 py-3 flex items-center gap-3 bg-white border-b border-[#EDEDEA]">

  <!-- Scrollable content -->
  <div class="flex-1 overflow-auto px-6 py-4">
```

Horizontal padding is always `px-6`. Top padding for the first section is `pt-6`. Sections are divided by `border-b border-[#EDEDEA]`.

---

## Summary / KPI Tiles

Rounded card, coloured background, no border.

```tsx
<div className="bg-[#F3F2EF] rounded-xl px-4 py-3">
  <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
  <p className="text-2xl font-bold text-[#1a1a1a]">{value}</p>
</div>
```

Use the semantic status `bg` colours for coloured tiles. Show `—` when loading.

---

## Tables

```tsx
<div className="overflow-auto max-h-[calc(100vh-320px)] rounded-xl border border-[#EDEDEA]">
  <table className="w-full text-sm border-collapse">
    <thead className="sticky top-0 bg-[#F8F8F6] z-10">
      <tr>
        <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#9a9a96] uppercase tracking-wider border-b border-[#EDEDEA]">
          Column
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-[#EDEDEA] hover:bg-[#F8F8F6] transition-colors">
        <td className="px-4 py-3 text-sm text-[#1a1a1a]">…</td>
      </tr>
    </tbody>
  </table>
</div>
```

Rules:
- Sticky header always uses `bg-[#F8F8F6]` and `z-10`
- Row hover: `hover:bg-[#F8F8F6]`
- Row highlight (warning state): `bg-[#FFFBEB]`
- Row highlight (error state): `bg-[#FFF5F5]`
- Cell padding: `px-4 py-3`
- Never use zebra striping — use status-based row colouring instead

---

## Badges / Status Pills

Inline-flex, rounded-full, small icon + label. Always use a semantic pair.

```tsx
<span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-xs font-medium text-[#065F46]">
  <CheckCircle2 size={11} />
  Active
</span>
```

Icon size inside badges: `size={11}`.

---

## Buttons

### Secondary / utility button

```tsx
<button className="flex items-center gap-1.5 rounded-lg border border-[#EDEDEA] bg-white px-3 py-1.5 text-xs text-[#6b6b6b] hover:bg-[#F3F2EF] transition-colors disabled:opacity-50">
  <Icon size={12} />
  Label
</button>
```

### Filter pill (toggle group)

```tsx
<button className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
  active ? "bg-[#4A5FD4] text-white" : "bg-[#F3F2EF] text-[#6b6b6b] hover:bg-[#EDEDEA]"
}`}>
  Label
</button>
```

### Destructive hover

```tsx
className="hover:bg-[#FEF2F2] hover:text-[#EF4444]"
```

---

## Form Inputs

```tsx
<input className="w-full rounded-lg border border-[#EDEDEA] bg-white py-1.5 pl-8 pr-3 text-sm placeholder:text-[#c4c4c0] focus:outline-none focus:ring-1 focus:ring-[#4A5FD4]" />

<select className="rounded-lg border border-[#EDEDEA] bg-white px-2.5 py-1.5 text-xs text-[#6b6b6b] focus:outline-none focus:ring-1 focus:ring-[#4A5FD4]" />
```

Focus ring is always `focus:ring-1 focus:ring-[#4A5FD4]`. No `focus:border-*`.

Search inputs get a leading icon positioned with `absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9a9a96]` and `pl-8` padding on the input.

---

## Navigation Sidebar

- Width: `w-[200px]`, fixed, `border-r border-[#EDEDEA]`
- Section label: `text-xs font-semibold text-[#9a9a96] uppercase tracking-wider px-3 pb-2`
- Nav item: `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm`
  - Inactive: `text-[#6b6b6b] hover:bg-[#F3F2EF] hover:text-[#1a1a1a]`
  - Active: `bg-[#EEF2FF] text-[#4A5FD4] font-medium`
- Active check for root routes (e.g. `/dashboard`): use exact match `pathname === href`, not `startsWith`, to avoid false-positives on subroutes
- Icon size: `size={15}`
- Sign-out button: `hover:bg-[#FEF2F2] hover:text-[#EF4444]`

---

## Loading States

Skeleton loaders use `animate-pulse` with the neutral background:

```tsx
<div className="h-10 rounded-lg bg-[#F3F2EF] animate-pulse" />
```

Spinning refresh icon: `className={loading ? "animate-spin" : ""}` on the icon, `disabled:opacity-50` on the button.

Show `—` in place of numeric values while loading.

---

## Error States

```tsx
<div className="flex items-center gap-2 text-sm text-[#EF4444] bg-[#FEF2F2] rounded-lg px-4 py-3">
  <AlertCircle size={15} />
  {message}
</div>
```

---

## Empty / Access-Denied States

Centered in the available space, muted icon, short message:

```tsx
<div className="flex h-full items-center justify-center p-12">
  <div className="text-center text-[#6b6b6b]">
    <Icon size={40} className="mx-auto mb-3 text-[#EF4444]" />
    <p className="font-medium">Message here.</p>
  </div>
</div>
```

---

## Icons

All icons from `lucide-react`. Standard sizes:

| Context | Size |
|---|---|
| Nav items | 15 |
| Page heading | 20 |
| Inside badges | 11 |
| Button icons | 12 |
| Error/empty state | 40 |
| Inline with text | 15 |

---

## General Rules

1. **No shadows** — depth is expressed through borders (`border-[#EDEDEA]`) and background colour shifts, never `shadow-*`.
2. **Rounded corners** — `rounded-lg` for inputs, buttons, rows; `rounded-xl` for cards and table wrappers.
3. **Transitions** — always add `transition-colors` on interactive elements; never `transition-all` on large components.
4. **Spacing rhythm** — `gap-3` between tiles, `gap-2.5` inside nav items and buttons, `gap-1.5` for icon+label pairs in small buttons.
5. **Role gating** — access-restricted pages must guard both client-side (early return with access-denied UI) and server-side (API returns 403). Never rely on nav hiding alone.
6. **Locale** — dates format with `en-IN` locale, 12-hour clock, `dd MMM yyyy, hh:mm aa`.
