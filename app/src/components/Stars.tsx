import { Icon } from "@/components/Icon";

interface StarsProps {
  count: number;
  showAll?: boolean;
}

export function Stars({ count, showAll = false }: StarsProps) {
  const n = Math.max(0, Math.min(5, Math.floor(count)));
  if (n === 0 && !showAll) return null;
  const total = showAll ? 5 : n;
  return (
    <span className="flex flex-none items-center text-accent" aria-label={`${n}-star hotel`}>
      {Array.from({ length: total }, (_, i) => (
        <Icon key={i} name="star" filled={i < n} size={14} />
      ))}
    </span>
  );
}
