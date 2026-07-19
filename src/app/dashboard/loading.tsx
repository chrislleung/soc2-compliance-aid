import { LoadingSkeleton } from "@/components/LoadingSkeleton";

export default function Loading() {
  return <LoadingSkeleton variant="cards" count={6} label="Loading dashboard…" />;
}
