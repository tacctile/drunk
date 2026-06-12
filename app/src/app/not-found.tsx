import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="mx-auto mt-16 flex max-w-2xl flex-col items-center gap-3 px-4 text-center">
      <Icon name="wrong_location" size={40} className="text-ink-dim" />
      <h1 className="text-title font-bold">That stop isn&apos;t on the route</h1>
      <p className="text-base text-ink-muted">Whatever you were looking for, it&apos;s not here.</p>
      <Link href="/cities" className="btn-accent mt-2">
        Back to the cities
      </Link>
    </div>
  );
}
