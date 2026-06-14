import { notFound } from "next/navigation";
import { cities, cityById } from "@/data/cities";
import { CityDetail } from "./CityDetail";

export function generateStaticParams() {
  return cities.map((c) => ({ id: c.id }));
}

export default function CityPage({ params }: { params: { id: string } }) {
  const city = cityById(params.id);
  if (!city) notFound();
  return <CityDetail cityId={params.id} />;
}
