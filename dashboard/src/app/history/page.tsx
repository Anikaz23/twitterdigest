import { getDigests, getTotalDigestCount } from "@/lib/db";
import DigestList from "@/components/DigestList";

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  const initialDigests = getDigests(10, 0);
  const total = getTotalDigestCount();
  const hasMore = total > initialDigests.length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Digest History</h1>
        <p className="text-gray-500">
          {total > 0
            ? `${total} digest${total === 1 ? "" : "s"} generated`
            : "No digests generated yet"}
        </p>
      </div>

      <DigestList initialDigests={initialDigests} initialHasMore={hasMore} />
    </div>
  );
}
