import { notFound } from "next/navigation";
import { getEvents, getMembers } from "@/lib/gas";
import EventDetailClient from "./EventDetailClient";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [events, members] = await Promise.all([getEvents(), getMembers()]);
  const event = events.find((e) => e.id === id);

  if (!event) notFound();

  return <EventDetailClient event={event} members={members} />;
}
