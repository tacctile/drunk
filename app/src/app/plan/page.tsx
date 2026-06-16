import { redirect } from "next/navigation";

// The plan wing opens on the Cities tab — the walkability index.
export default function PlanIndex() {
  redirect("/plan/cities");
}
