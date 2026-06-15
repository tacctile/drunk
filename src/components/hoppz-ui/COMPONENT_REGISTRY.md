# Hoppz UI — Component Registry

All components use M3-style design tokens from `tailwind.preset.ts`. Import the preset in your `tailwind.config.ts` to enable the token classes.

| Component | File | Props | Description |
|---|---|---|---|
| OverlayHeader | `OverlayHeader.tsx` | `title`, `onBack?`, `rightSlot?` | Full-width header bar with back button, centered title, and optional right slot |
| TabBar | `TabBar.tsx` | `tabs`, `activeTab`, `onTabChange` | Horizontal tab navigation with active underline indicator |
| InitialsAvatar | `InitialsAvatar.tsx` | `initials`, `size?`, `color?`, `avatarUrl?` | Circular avatar showing initials or an image |
| ProfileHero | `ProfileHero.tsx` | `initials`, `name`, `subtitle`, `avatarColor?`, `avatarUrl?`, `onEditPhoto?` | Avatar + display name + subtitle block |
| Card | `Card.tsx` | `children`, `className?` | Surface card with rim-light top border and shadow |
| CardHeader | `CardHeader.tsx` | `icon`, `title`, `rightIcon?`, `rightIconClassName?`, `onRightIconClick?` | Icon + title row for card headers, optional right action |
| PinInput | `PinInput.tsx` | `value`, `onChange`, `maxLength?`, `placeholder?`, `hint?` | Centered PIN entry field with visibility toggle |
| TextField | `TextField.tsx` | `label`, `value`, `onChange`, `maxLength?`, `type?`, `placeholder?` | Labeled text input field |
| ActionRow | `ActionRow.tsx` | `icon`, `label`, `onClick?`, `variant?` | Full-width icon + text button row (default or danger variant) |
| SectionLabel | `SectionLabel.tsx` | `children` | Uppercase tracking-wider section header text |
| GradeBadge | `GradeBadge.tsx` | `grade` | Small colored pill badge for letter grades |
| BottomNav | `BottomNav.tsx` | `children` | Bottom navigation bar container with safe-area padding |
| BottomNavItem | `BottomNavItem.tsx` | `icon`, `label?`, `active?`, `filled?`, `onClick?` | Individual bottom nav icon with optional label |
| FloatingAction | `FloatingAction.tsx` | `icon?`, `label`, `onClick?`, `visible?` | Fixed floating full-width CTA button |
| LinkRow | `LinkRow.tsx` | `label`, `onClick?` | Navigation row with text and trailing chevron |
