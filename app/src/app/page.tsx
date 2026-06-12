import { redirect } from "next/navigation";

// The Cities tab — the walkability index — is the first screen.
export default function Home() {
  redirect("/cities");
}
