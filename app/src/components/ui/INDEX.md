# UI Component Library Index

Shared visual primitives for the Hoppz reskin. Single source of truth — check here before building.

---

## SettingToggle

- **File:** `src/components/ui/SettingToggle.tsx`
- **Props:** `icon` (Material Symbols name), `iconClassName` (icon color class, default `text-ink-muted`), `iconBgClassName` (icon circle bg class, default `bg-raised`), `title`, `subtitle?`, `checked`, `disabled?`, `dimmed?` (reduces opacity), `onToggle`, `ariaLabel`
- **What it does:** A settings row with a leading icon circle, title + subtitle, and a trailing Switch toggle. 44px touch target via the Switch component.
- **Used by:** `/social/locate` (Location Options modal — Share Live Position toggle)
