import { StarRating } from "@hoppz-ui";

interface StarsProps {
  count: number;
}

export function Stars({ count }: StarsProps) {
  const n = Math.max(0, Math.min(5, Math.floor(count)));
  if (n === 0) return null;
  return <StarRating rating={n} colorClassName="text-accent" />;
}
