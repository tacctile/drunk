import { Icon } from "@/components/Icon";

/** Night Out wing — placeholder. The AppShell header stays; the social layout
 *  supplies the bottom nav. */
export default function SocialPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-2xl flex-col items-center justify-center gap-3 px-6 text-center">
      <Icon name="local_bar" size={48} className="text-ink-dim" />
      <h1 className="text-title font-bold text-ink">Night Out</h1>
      <p className="max-w-xs text-meta font-normal text-ink-muted">
        Coming soon — this is where the party happens
      </p>
    </div>
  );
}
