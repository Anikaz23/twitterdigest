import { DigestWithParsed } from "@/lib/db";

interface DigestCardProps {
  digest: DigestWithParsed;
  expanded?: boolean;
}

export default function DigestCard({ digest, expanded = false }: DigestCardProps) {
  const formattedDate = new Date(digest.created_at).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <article className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <time className="text-sm text-gray-500">{formattedDate}</time>
        <span className="text-sm text-gray-500">
          {digest.tweet_count} tweets analyzed
        </span>
      </div>

      {digest.topics && digest.topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {digest.topics.map((topic, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      <div className="prose prose-invert prose-sm max-w-none">
        <div
          className={`text-gray-300 leading-relaxed whitespace-pre-wrap ${
            !expanded && "line-clamp-6"
          }`}
        >
          {digest.summary}
        </div>
      </div>

      {!expanded && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <a
            href={`/?id=${digest.id}`}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Read full digest
          </a>
        </div>
      )}
    </article>
  );
}
