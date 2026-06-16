import { Icon } from "@/components/Icon";

interface StarsProps {
  count: number;
}

export function Stars({ count }: StarsProps) {
  const n = Math.max(0, Math.min(5, Math.floor(count)));
  if (n === 0) return null;
  return (
    <span className="flex flex-none items-center text-accent" aria-label={`${n}-star hotel`}>
      {Array.from({ length: n }, (_, i) => (
        <Icon key={i} name="star" filled size={14} />
      ))}
    </span>
  );
}
