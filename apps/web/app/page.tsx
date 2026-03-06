import { ConflictMap } from "@/components/ConflictMap";
import { getFeedData } from "@/lib/feed-data";

export default async function Page() {
  // The page only coordinates data loading; map behavior stays in components.
  const data = await getFeedData();
  return <ConflictMap events={data.events} forces={data.forces} assets={data.assets} />;
}
