import { EventsTableView } from "@/components/EventsTableView";
import { getFeedData } from "@/lib/feed-data";

export default async function TablePage() {
  const data = await getFeedData();
  return <EventsTableView events={data.events} />;
}
