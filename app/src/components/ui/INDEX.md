# UI Component Library Index

Shared visual primitives for the Hoppz reskin. Single source of truth — check here before building.

---

## GlassCard

- **File:** `src/components/ui/GlassCard.tsx`
- **Props:** `children` (ReactNode), `className?` (extra classes — add padding, flex, etc.)
- **What it does:** Elevated card container with surface background, standard border, and subtle depth shadow. No internal padding — caller controls spacing via className. Matches the Stitch "glass-card" pattern mapped to our token system.
- **Used by:** `/plan/board` (Top Cities card, Hot Dates card), `/plan/hopperz` (member cards in list + grid)

## ProgressBar

- **File:** `src/components/ui/ProgressBar.tsx`
- **Props:** `percent` (0–100), `colorClassName?` (Tailwind bg class for the fill, default `bg-accent`)
- **What it does:** Thin horizontal progress bar (6px/1.5 height). Raised-color track with a colored fill bar. Percent is clamped 0–100. Fill transitions smoothly on change.
- **Used by:** `/plan/board` (city vote proportion bars)

## DateBadge

- **File:** `src/components/ui/DateBadge.tsx`
- **Props:** `dateKey` (YYYY-MM-DD string), `variant?` (`"primary"` | `"muted"`, default `"primary"`)
- **What it does:** 40×40px date display badge showing 3-letter month abbreviation and day number. Primary variant uses green background/border (availability accent), muted uses raised background with standard border.
- **Used by:** `/plan/board` (hot dates column)

## SettingToggle

- **File:** `src/components/ui/SettingToggle.tsx`
- **Props:** `icon` (Material Symbols name), `iconClassName` (icon color class, default `text-ink-muted`), `iconBgClassName` (icon circle bg class, default `bg-raised`), `title`, `subtitle?`, `checked`, `disabled?`, `dimmed?` (reduces opacity), `onToggle`, `ariaLabel`
- **What it does:** A settings row with a leading icon circle, title + subtitle, and a trailing Switch toggle. 44px touch target via the Switch component.
- **Used by:** `/social/locate` (Location Options modal — Share Live Position toggle)

## StatusChip

- **File:** `src/components/ui/StatusChip.tsx`
- **Props:** `label` (string), `variant?` (`"active"` | `"muted"`, default `"muted"`), `icon?` (Material Symbols name)
- **What it does:** Small pill-shaped status indicator. Active variant uses green text on green-dim background; muted variant uses ink-muted text on raised background. Optional leading icon at 14px. Rounded-full, no-shrink. Matches the Stitch member status chip pattern.
- **Used by:** `/plan/hopperz` (Remote/Out trip status chips on member cards)

## GlassIconButton

- **File:** `src/components/ui/GlassIconButton.tsx`
- **Props:** `icon` (Material Symbols name), `iconSize?` (default 24), `label?` (text below icon), `onClick?`, `ariaLabel`, `className?`
- **What it does:** A translucent circular icon button with frosted glass effect (bg-black/40, backdrop-blur-md, border-white/10). 48px touch target. Optional label renders below in 12px semibold white text with drop shadow. Active state scales down to 95%.
- **Used by:** `/social/camera` (back button, gallery button, flip camera button, review back button)
