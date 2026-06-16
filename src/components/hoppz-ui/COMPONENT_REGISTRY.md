# Hoppz UI — Component Registry

All components use M3-style design tokens from `tailwind.preset.ts`. Import the preset in your `tailwind.config.ts` to enable the token classes.

| Component | File | Props | Description |
|---|---|---|---|
| OverlayHeader | `OverlayHeader.tsx` | `title`, `onBack?`, `rightSlot?` | Full-width header bar with back button, centered title, and optional right slot |
| TabBar | `TabBar.tsx` | `tabs`, `activeTab`, `onTabChange`, `sticky?`, `stickyOffset?`, `activeColor?` | Horizontal tab navigation with active underline indicator; sticky mode pins below header with configurable offset and active color |
| InitialsAvatar | `InitialsAvatar.tsx` | `initials`, `size?` (xs/sm/md/lg), `color?`, `colorClassName?`, `avatarUrl?`, `statusColor?`, `bordered?`, `borderClassName?` | Circular avatar showing initials or an image, with optional status dot, border ring, and Tailwind color class support |
| ProfileHero | `ProfileHero.tsx` | `initials`, `name`, `subtitle`, `avatarColor?`, `avatarUrl?`, `onEditPhoto?`, `centered?` | Avatar + display name + subtitle block; centered mode stacks vertically for sheets |
| Card | `Card.tsx` | `children`, `className?`, `glass?` | Surface card with rim-light top border and shadow; glass variant adds backdrop blur |
| CardHeader | `CardHeader.tsx` | `icon`, `title`, `iconClassName?`, `rightIcon?`, `rightIconClassName?`, `onRightIconClick?` | Icon + title row for card headers with customizable icon color |
| PinInput | `PinInput.tsx` | `value`, `onChange`, `maxLength?`, `placeholder?`, `hint?` | Centered PIN entry field with visibility toggle |
| TextField | `TextField.tsx` | `label`, `value`, `onChange`, `maxLength?`, `type?`, `placeholder?` | Labeled text input field |
| ActionRow | `ActionRow.tsx` | `icon`, `label`, `onClick?`, `variant?` | Full-width icon + text button row (default or danger variant) |
| SectionLabel | `SectionLabel.tsx` | `children` | Uppercase tracking-wider section header text |
| GradeBadge | `GradeBadge.tsx` | `grade`, `colorScheme?` (secondary/tertiary/error), `pill?` | Colored pill badge for letter grades with configurable color scheme and pill shape |
| BottomNav | `BottomNav.tsx` | `children`, `className?`, `height?`, `elevated?`, `fixed?` | Bottom navigation bar container with safe-area padding, optional drop shadow, and fixed positioning |
| BottomNavItem | `BottomNavItem.tsx` | `icon`, `label?`, `active?`, `filled?`, `activeColor?`, `fill?`, `onClick?` | Individual bottom nav icon with optional label; fill mode expands to fill parent |
| FloatingAction | `FloatingAction.tsx` | `icon?`, `label`, `onClick?`, `visible?`, `toggled?`, `iconFilled?`, `variant?` (solid/glass) | Fixed floating full-width CTA button; glass variant with toggle state for vote-style FABs |
| LinkRow | `LinkRow.tsx` | `label`, `onClick?` | Navigation row with text and trailing chevron |
| TopAppBar | `TopAppBar.tsx` | `title`, `subtitle?`, `leadingIcon?`, `leadingIconClassName?`, `onLeadingAction?`, `centerSlot?`, `actions?`, `position?` (sticky/fixed), `glass?` | Sticky or fixed top header bar with glass blur variant, subtitle, clickable leading icon, center slot, and right action slot |
| ProgressBar | `ProgressBar.tsx` | `value`, `colorClassName?` | Thin horizontal progress bar with customizable fill color |
| GhostButton | `GhostButton.tsx` | `label`, `colorClassName?`, `onClick?` | Semi-transparent full-width action button |
| VoteRow | `VoteRow.tsx` | `label`, `count`, `countLabel?`, `percentage`, `highlight?`, `actionLabel?`, `onAction?` | City vote row with label, count, progress bar, and optional action |
| DateTile | `DateTile.tsx` | `month`, `day`, `highlight?` | Small calendar tile showing abbreviated month and day number |
| DateRow | `DateRow.tsx` | `month`, `day`, `dateRange`, `freeCount`, `freeLabel?`, `highlight?`, `actionLabel?`, `onAction?` | Date tile + range text + availability count with optional action |
| SectionHeader | `SectionHeader.tsx` | `title`, `actionLabel?`, `actionClassName?`, `onAction?` | Section title with optional right-aligned action link |
| RatingPill | `RatingPill.tsx` | `rating`, `icon?` | Overlay pill badge with filled icon and rating number |
| HotelCard | `HotelCard.tsx` | `imageUrl`, `imageAlt?`, `rating?`, `name`, `subtitle`, `preferenceCount?`, `preferenceLabel?`, `price?`, `priceUnit?`, `onClick?` | Image card with rating overlay, hotel info, preference count, and price |
| HorizontalScroll | `HorizontalScroll.tsx` | `children`, `className?` | Horizontal scroll container with hidden scrollbars and mobile edge bleed |
| StatusPill | `StatusPill.tsx` | `icon?`, `label`, `iconClassName?`, `className?`, `size?` (sm/md), `variant?` (default/active/muted/glass/primary), `dot?`, `dotClassName?` | Compact pill indicator with optional leading icon/dot; primary variant for countdown badges, glass for camera overlays |
| DayDivider | `DayDivider.tsx` | `label` | Centered date/section divider pill for chat or list views |
| ReactionPill | `ReactionPill.tsx` | `emoji`, `count`, `active?`, `onClick?` | Emoji reaction badge with count for message reactions |
| ChatBubble | `ChatBubble.tsx` | `variant` (own/other), `text?`, `imageUrl?`, `imageAlt?`, `senderName?`, `senderNameColor?`, `senderInitials?`, `senderColor?`, `senderAvatarUrl?`, `timestamp?`, `grouped?`, `reactions?`, `onReactionClick?`, `onClick?` | Chat message bubble supporting own/other variants, text/image content, grouped messages, and reactions |
| ChatInputBar | `ChatInputBar.tsx` | `placeholder?`, `leadingActions?`, `value?`, `onChange?`, `onSend?` | Message composition bar with media action buttons, auto-growing textarea, and send button |
| MapPin | `MapPin.tsx` | `label`, `color?`, `glowColor?`, `animated?`, `variant?` (dot/icon), `labelClassName?`, `labelTextClassName?`, `iconClassName?`, `onClick?` | Map pin with name label; dot variant shows colored pulse dot, icon variant shows filled location_on icon with colored label |
| PersonRow | `PersonRow.tsx` | `initials`, `name`, `subtitle?`, `avatarColor?`, `avatarUrl?`, `statusColor?`, `trailingIcon?`, `onClick?` | Person list item with avatar, status dot, name, subtitle, and trailing action icon |
| GroupCard | `GroupCard.tsx` | `icon`, `name`, `status`, `statusClassName?`, `iconBgClassName?`, `iconClassName?`, `onClick?` | Group info card with icon, name, and status text |
| ToggleSwitch | `ToggleSwitch.tsx` | `checked?`, `onChange?`, `disabled?`, `ariaLabel?` | iOS-style toggle switch with peer-checked Tailwind styling |
| SettingsToggleRow | `SettingsToggleRow.tsx` | `icon`, `title`, `description?`, `iconBgClassName?`, `iconClassName?`, `checked?`, `onChange?`, `disabled?` | Settings row with icon, title, description, and toggle switch |
| DialogModal | `DialogModal.tsx` | `open`, `onClose`, `title`, `children`, `footer?` | Centered modal dialog with blurred backdrop overlay and close button |
| FloatingPill | `FloatingPill.tsx` | `icon?`, `iconClassName?`, `label`, `onClick?`, `className?`, `variant?` (primary/glass/sort) | Pill-shaped floating button; sort variant for column sort indicators with backdrop blur |
| SlidingPanel | `SlidingPanel.tsx` | `title`, `headerRight?`, `children`, `footer?`, `open?`, `onToggle?`, `width?` | Side sliding panel with toggle handle, scrollable content, and footer section |
| PageTitle | `PageTitle.tsx` | `children` | Display-lg page heading for top-level screen titles |
| MemberCard | `MemberCard.tsx` | `initials`, `name`, `avatarColor?`, `avatarUrl?`, `statusDotColor?`, `statusText?`, `badge?`, `onClick?` | Glass-card member row with avatar, status dot, location text, and trailing badge |
| BottomSheet | `BottomSheet.tsx` | `open`, `onClose`, `children` | Bottom sliding sheet with drag handle, backdrop overlay, and animated entry |
| InfoCard | `InfoCard.tsx` | `label`, `value` | Labeled key-value info display card for detail sheets |
| ActionButton | `ActionButton.tsx` | `label`, `icon?`, `variant?` (filled/ghost/glow), `iconPosition?` (leading/trailing), `fullWidth?`, `onClick?` | Action button with filled, ghost, or glow variant; supports trailing icon and full-width mode |
| GlassIconButton | `GlassIconButton.tsx` | `icon`, `ariaLabel`, `size?` (sm/md), `onClick?`, `className?` | Circular frosted-glass icon button for camera/media overlays |
| GalleryThumbnail | `GalleryThumbnail.tsx` | `src`, `alt?`, `onClick?`, `className?` | Square image preview tile for gallery/camera quick access |
| ShutterButton | `ShutterButton.tsx` | `onClick?`, `disabled?`, `className?` | Camera capture shutter button with press animation |
| ViewfinderFrame | `ViewfinderFrame.tsx` | `src?`, `alt?`, `children?`, `className?` | Full-screen image background with overlay content slot for camera UIs |
| PhotoGrid | `PhotoGrid.tsx` | `columns?` (2/3/4), `gap?`, `children`, `className?` | Grid container for photo gallery layouts with configurable column count |
| PhotoGridItem | `PhotoGridItem.tsx` | `src?`, `alt?`, `onClick?`, `className?` | Square aspect-ratio photo cell with press-scale feedback for gallery grids |
| Fab | `Fab.tsx` | `icon`, `ariaLabel`, `filled?`, `onClick?`, `className?` | Circular floating action button anchored bottom-right with shadow and rim light |
| StickyDateHeader | `StickyDateHeader.tsx` | `label`, `topOffset?`, `className?` | Sticky date section divider with backdrop blur, pins below the top app bar |
| VoteButton | `VoteButton.tsx` | `voted?`, `icon?`, `onClick?` | Circular icon toggle button for voting with filled/unfilled states |
| WalkScoreDisplay | `WalkScoreDisplay.tsx` | `score`, `grade`, `colorScheme?` (secondary/tertiary/error) | Walk score number with grade badge, color-coded by score quality |
| ColumnHeaders | `ColumnHeaders.tsx` | `columns`, `sticky?`, `topOffset?` | Sticky column header strip with uppercase labels and backdrop blur |
| CityListRow | `CityListRow.tsx` | `cityName`, `stateCode`, `district?`, `walkScore`, `grade`, `gradeColor?`, `distance`, `driveTime`, `voted?`, `onVote?`, `onClick?` | City list row with name/state, walk score, distance, and vote button columns |
| TripHeroCard | `TripHeroCard.tsx` | `label`, `destination`, `countdownValue`, `countdownLabel`, `dateRange?`, `dateIcon?`, `accentClassName?`, `className?` | Hero card with left accent border showing trip destination, countdown, and date range |
| StatTile | `StatTile.tsx` | `icon`, `iconClassName?`, `value`, `label`, `className?` | Compact stat tile with icon, large value, and label for horizontal scroll rows |
| QuickActionCard | `QuickActionCard.tsx` | `icon`, `iconClassName?`, `label`, `onClick?`, `className?` | Tall card-style action button with large icon and label for grid layouts |
| AvatarChip | `AvatarChip.tsx` | `name`, `initials?`, `color?` (primary/secondary/tertiary/error/primary-fixed), `active?`, `invite?`, `icon?`, `onClick?` | Avatar circle with name label; supports colored member and dashed-border invite variants |
| StarRating | `StarRating.tsx` | `rating`, `max?`, `size?`, `colorClassName?` | Star rating display with filled/empty stars using Material Symbols |
| PreferButton | `PreferButton.tsx` | `preferred?`, `label?`, `preferredLabel?`, `onClick?` | Toggle button for prefer/preferred state with heart icon and filled/outlined variants |
| TagBadge | `TagBadge.tsx` | `label`, `variant?` (secondary/primary/tertiary), `className?` | Small pill badge for venue category tags with bordered color variants |
| VenueListCard | `VenueListCard.tsx` | `name`, `address?`, `imageUrl?`, `imageAlt?`, `price?`, `tags?`, `rating?`, `action?`, `onClick?` | Horizontal list card for venues; shows thumbnail when imageUrl provided, otherwise compact title+tags layout |
| MapHero | `MapHero.tsx` | `imageUrl`, `imageAlt?`, `height?`, `grayscale?`, `opacity?`, `children?` | Full-width map image hero section with grayscale overlay and children slot for pins/markers |
