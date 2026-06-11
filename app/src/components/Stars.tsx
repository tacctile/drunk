import { Icon } from "./Icon";

/** Hotel star rating — quiet metadata, never accent. */
export function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-px text-muted" role="img" aria-label={`${count}-star hotel`}>
      {Array.from({ length: count }, (_, i) => (
        <Icon key={i} name="star" filled size={13} />
      ))}
    </span>
  );
}
