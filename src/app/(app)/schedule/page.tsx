import { getMembers, getEvents } from "@/lib/gas";
import ScheduleClient from "./ScheduleClient";

export default async function SchedulePage() {
  const [members, events] = await Promise.all([getMembers(), getEvents()]);

  return <ScheduleClient members={members} initialEvents={events} />;
}
