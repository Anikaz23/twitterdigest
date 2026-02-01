import { getDigests } from "@/lib/api";
import DigestList from "@/components/DigestList";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const response = await getDigests(10, 0);
  const { digests, pagination } = response;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Digest History</h1>
        <p className="text-gray-500">
          {pagination.total > 0
            ? `${pagination.total} digest${pagination.total === 1 ? "" : "s"} generated`
            : "No digests generated yet"}
        </p>
      </div>

      <DigestList initialDigests={digests} initialHasMore={pagination.hasMore} />
    </div>
  );
}
