# UI Component Library Index

Shared visual primitives for the Hoppz reskin. Single source of truth — check here before building.

---

## SettingToggle

- **File:** `src/components/ui/SettingToggle.tsx`
- **Props:** `icon` (Material Symbols name), `iconClassName` (icon color class, default `text-ink-muted`), `iconBgClassName` (icon circle bg class, default `bg-raised`), `title`, `subtitle?`, `checked`, `disabled?`, `dimmed?` (reduces opacity), `onToggle`, `ariaLabel`
- **What it does:** A settings row with a leading icon circle, title + subtitle, and a trailing Switch toggle. 44px touch target via the Switch component.
- **Used by:** `/social/locate` (Location Options modal — Share Live Position toggle)

## GlassIconButton

- **File:** `src/components/ui/GlassIconButton.tsx`
- **Props:** `icon` (Material Symbols name), `iconSize?` (default 24), `label?` (text below icon), `onClick?`, `ariaLabel`, `className?`
- **What it does:** A translucent circular icon button with frosted glass effect (bg-black/40, backdrop-blur-md, border-white/10). 48px touch target. Optional label renders below in 12px semibold white text with drop shadow. Active state scales down to 95%.
- **Used by:** `/social/camera` (back button, gallery button, flip camera button, review back button)
