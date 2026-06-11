import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="card mt-10 flex flex-col items-center gap-3 p-10 text-center">
      <Icon name="wrong_location" size={40} className="text-accent" />
      <h1 className="text-xl font-extrabold">That stop isn&apos;t on the route</h1>
      <p className="text-sm text-muted">Whatever you were looking for, it&apos;s not here.</p>
      <Link href="/" className="btn-accent mt-2">
        Back to the dashboard
      </Link>
    </div>
  );
}
