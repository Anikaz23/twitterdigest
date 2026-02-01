import { getLatestDigest } from "@/lib/api";
import DigestCard from "@/components/DigestCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const latestDigest = await getLatestDigest();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Latest Digest</h1>
        <p className="text-gray-500">
          AI-generated summary of your Twitter "For You" feed
        </p>
      </div>

      {latestDigest ? (
        <>
          <DigestCard digest={latestDigest} expanded />
          <div className="mt-8 text-center">
            <Link
              href="/history"
              className="text-gray-400 hover:text-white transition-colors"
            >
              View all digests
            </Link>
          </div>
        </>
      ) : (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No Digests Yet
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Your Twitter digest will appear here once the agent runs for the
            first time. Digests are generated every 3 hours.
          </p>
        </div>
      )}
    </div>
  );
}
