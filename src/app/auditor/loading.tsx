import { LoadingSkeleton } from "@/components/LoadingSkeleton";

export default function Loading() {
  return <LoadingSkeleton variant="cards" count={7} label="Loading auditor summary…" />;
}
