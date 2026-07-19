import { LoadingSkeleton } from "@/components/LoadingSkeleton";

export default function Loading() {
  return <LoadingSkeleton variant="rows" count={5} label="Loading policies…" />;
}
