// Shared body scroll lock for every overlay (Dialog, BottomSheet,
// ProfileOverlay). Counter-based because overlays stack and can unmount in
// the same React commit (e.g. a confirm dialog over an edit dialog): the old
// save-and-restore pattern let the first cleanup restore "" and the second
// restore "hidden", leaving the page permanently unscrollable.
let locks = 0;

export function lockBodyScroll() {
  locks += 1;
  if (locks === 1) document.body.style.overflow = "hidden";
}

export function unlockBodyScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) document.body.style.overflow = "";
}
