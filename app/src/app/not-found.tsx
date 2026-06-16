import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageTitle, ActionButton } from "@hoppz-ui";

export default function NotFound() {
  return (
    <div className="mx-auto mt-16 flex max-w-2xl flex-col items-center gap-3 px-4 text-center">
      <Icon name="wrong_location" size={40} className="text-ink-dim" />
      <PageTitle>That stop isn&apos;t on the route</PageTitle>
      <p className="text-base text-ink-muted">Whatever you were looking for, it&apos;s not here.</p>
      <Link href="/plan/cities" className="mt-2">
        <ActionButton variant="filled" label="Back to the cities" />
      </Link>
    </div>
  );
}
