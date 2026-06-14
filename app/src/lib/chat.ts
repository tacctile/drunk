export interface MessageRow {
  id: string;
  voter_id: string;
  content: string | null;
  image_url: string | null;
  reply_to_id: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface ReactionRow {
  message_id: string;
  voter_id: string;
  emoji: string;
  created_at: string;
}

export interface ReadRow {
  message_id: string;
  voter_id: string;
  read_at: string;
}

export const CHAT_PAGE_SIZE = 50;

export const GALLERY_PAGE_SIZE = 30;

export const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '🍺'];

export function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDayDivider(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - target.getTime();
  const oneDay = 86400000;

  if (diff < oneDay && diff >= 0) return "Today";
  if (diff < oneDay * 2 && diff >= oneDay) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function isDifferentDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() !== db.getFullYear() ||
    da.getMonth() !== db.getMonth() ||
    da.getDate() !== db.getDate()
  );
}

export function shouldGroup(a: MessageRow, b: MessageRow): boolean {
  if (a.voter_id !== b.voter_id) return false;
  const diff = Math.abs(
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return diff < 120000;
}

export function groupReactions(
  reactions: ReactionRow[]
): { emoji: string; count: number; voterIds: string[] }[] {
  const map = new Map<string, { voterIds: string[]; earliest: number }>();
  for (const r of reactions) {
    const entry = map.get(r.emoji);
    const t = new Date(r.created_at).getTime();
    if (entry) {
      entry.voterIds.push(r.voter_id);
      if (t < entry.earliest) entry.earliest = t;
    } else {
      map.set(r.emoji, { voterIds: [r.voter_id], earliest: t });
    }
  }
  return Array.from(map.entries())
    .map(([emoji, { voterIds, earliest }]) => ({
      emoji,
      count: voterIds.length,
      voterIds,
      earliest,
    }))
    .sort((a, b) => b.count - a.count || a.earliest - b.earliest)
    .map(({ emoji, count, voterIds }) => ({ emoji, count, voterIds }));
}
