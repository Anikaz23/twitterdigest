import type { Digest, DigestTweet } from "@/lib/types";

function isoMinutesAgo(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

function dayKey(daysAgo = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function demoTweet(params: {
  id: string;
  text: string;
  authorHandle: string;
  minutesAgo: number;
  url?: string;
  position: number;
  isNew?: boolean;
}): DigestTweet {
  return {
    id: params.id,
    text: params.text,
    authorHandle: params.authorHandle,
    timestamp: isoMinutesAgo(params.minutesAgo),
    url: params.url ?? "",
    position: params.position,
    isNew: params.isNew ?? true,
  };
}

const demoTweetsA: DigestTweet[] = [
  demoTweet({
    id: "demo-a-1",
    text: "Shipping the onboarding refresh tonight. Biggest change: no forced account linking on first run.",
    authorHandle: "@buildwithmaya",
    minutesAgo: 48,
    url: "https://x.com/buildwithmaya/status/demo-a-1",
    position: 1,
  }),
  demoTweet({
    id: "demo-a-2",
    text: "Infra note: we moved digest reads to pooled queries and p95 is now under 120ms in the EU region.",
    authorHandle: "@stackcore",
    minutesAgo: 43,
    url: "https://x.com/stackcore/status/demo-a-2",
    position: 2,
  }),
  demoTweet({
    id: "demo-a-3",
    text: "Small but useful: timeline filters now persist between sessions so context doesn't reset every open.",
    authorHandle: "@productops",
    minutesAgo: 39,
    url: "https://x.com/productops/status/demo-a-3",
    position: 3,
  }),
  demoTweet({
    id: "demo-a-4",
    text: "Posting API has a new backoff strategy. Fewer retries, smarter timing, less noisy logs.",
    authorHandle: "@reliabilitylab",
    minutesAgo: 35,
    url: "https://x.com/reliabilitylab/status/demo-a-4",
    position: 4,
  }),
  demoTweet({
    id: "demo-a-5",
    text: "We are testing a digest quality rubric: relevance, novelty, and clarity scores per run.",
    authorHandle: "@aiworkflow",
    minutesAgo: 29,
    url: "https://x.com/aiworkflow/status/demo-a-5",
    position: 5,
  }),
  demoTweet({
    id: "demo-a-6",
    text: "Reminder: bearer token cannot access home timeline. OAuth 1.0a required for that mode.",
    authorHandle: "@apiguide",
    minutesAgo: 22,
    url: "https://x.com/apiguide/status/demo-a-6",
    position: 6,
  }),
  demoTweet({
    id: "demo-a-7",
    text: "Database status cards now show soft-fail warnings instead of hard-stop blank UI.",
    authorHandle: "@shipfaster",
    minutesAgo: 17,
    url: "https://x.com/shipfaster/status/demo-a-7",
    position: 7,
  }),
  demoTweet({
    id: "demo-a-8",
    text: "Theme updates landed: cleaner light palette and improved contrast for metadata rows.",
    authorHandle: "@uiops",
    minutesAgo: 11,
    url: "https://x.com/uiops/status/demo-a-8",
    position: 8,
  }),
];

const demoTweetsB: DigestTweet[] = [
  demoTweet({
    id: "demo-b-1",
    text: "Search mode now validates query before hitting API; avoids empty fetch runs.",
    authorHandle: "@devnotes",
    minutesAgo: 142,
    url: "https://x.com/devnotes/status/demo-b-1",
    position: 1,
  }),
  demoTweet({
    id: "demo-b-2",
    text: "Added digest-level idempotency to stop duplicate inserts when cron retried.",
    authorHandle: "@backendcraft",
    minutesAgo: 136,
    url: "https://x.com/backendcraft/status/demo-b-2",
    position: 2,
  }),
  demoTweet({
    id: "demo-b-3",
    text: "Card expansion now prefetches source tweets to cut first-open wait.",
    authorHandle: "@frontendloop",
    minutesAgo: 129,
    url: "https://x.com/frontendloop/status/demo-b-3",
    position: 3,
  }),
  demoTweet({
    id: "demo-b-4",
    text: "Long summaries should stay paragraph-based so changes are easy to skim.",
    authorHandle: "@writingux",
    minutesAgo: 123,
    url: "https://x.com/writingux/status/demo-b-4",
    position: 4,
  }),
  demoTweet({
    id: "demo-b-5",
    text: "Moved fallback to display demo digests when DB is not ready. Better first-run UX.",
    authorHandle: "@launchlog",
    minutesAgo: 116,
    url: "https://x.com/launchlog/status/demo-b-5",
    position: 5,
  }),
  demoTweet({
    id: "demo-b-6",
    text: "Schema check remains lazy and cached, so startup overhead stays bounded.",
    authorHandle: "@dbcraft",
    minutesAgo: 109,
    url: "https://x.com/dbcraft/status/demo-b-6",
    position: 6,
  }),
];

const demoTweetsC: DigestTweet[] = [
  demoTweet({
    id: "demo-c-1",
    text: "Roadmap: worker endpoint remains optional; primary ingest stays in main app.",
    authorHandle: "@archreview",
    minutesAgo: 289,
    url: "https://x.com/archreview/status/demo-c-1",
    position: 1,
  }),
  demoTweet({
    id: "demo-c-2",
    text: "Config screen now separates Twitter source mode, summarizer provider, and DB storage clearly.",
    authorHandle: "@productplan",
    minutesAgo: 281,
    url: "https://x.com/productplan/status/demo-c-2",
    position: 2,
  }),
  demoTweet({
    id: "demo-c-3",
    text: "Added clearer setup copy for API key onboarding and less setup friction.",
    authorHandle: "@onboardlab",
    minutesAgo: 270,
    url: "https://x.com/onboardlab/status/demo-c-3",
    position: 3,
  }),
  demoTweet({
    id: "demo-c-4",
    text: "Next step is tightening cron-trigger auth and request provenance checks.",
    authorHandle: "@securityops",
    minutesAgo: 260,
    url: "https://x.com/securityops/status/demo-c-4",
    position: 4,
  }),
];

function summaryA(): string {
  return [
    "The main product theme today is cleanup of the ingest-to-digest path so users can run the app without hard failures on first deploy. Several updates focus on avoiding blank states: status cards now degrade gracefully, and cards can still render realistic content when backend connectivity is temporarily unstable.",
    "Operational updates center on reliability and latency. Query paths were streamlined for faster reads, retry behavior on network errors was tightened, and noisy retries were reduced. Together, these changes target better p95 response times and more predictable behavior during traffic spikes.",
    "On the UX side, the flow is now more context-preserving. Timeline filters persist, card expansion became faster through prefetching, and the light theme was tuned for stronger visual hierarchy. These changes do not alter core business logic but materially improve day-to-day usability.",
    "A key platform constraint was reiterated: bearer-token mode cannot read home timeline, while OAuth 1.0a can. The team is shaping config UX around these constraints so users pick valid modes earlier and avoid dead-end settings. This should reduce setup confusion and support overhead.",
    "Overall, today’s direction is pragmatic: fewer moving parts in critical paths, clearer setup boundaries, and stronger defaults. The updates are incremental but aligned toward a stable baseline that can support future worker integration without forcing worker dependency from day one.",
  ].join("\n\n");
}

function summaryB(): string {
  return [
    "Recent engineering work concentrated on making digest generation deterministic under retries and partial failures. Idempotency was reinforced at digest creation to prevent duplicate writes, and guardrails were added around search mode so empty or malformed queries are blocked before expensive API calls.",
    "The UI layer received a performance pass aimed at interaction smoothness rather than visual complexity. Card expansions now prefetch tweet payloads, reducing the perceived delay on first click. Summary rendering was kept paragraph-based for scanability, while preserving enough detail to remain useful as an audit artifact.",
    "A practical first-run experience was also prioritized: when persistent storage is absent or not yet reachable, the app can still present realistic demo digests. This avoids a dead screen, helps validate layout behavior quickly, and gives a reliable baseline for front-end iteration before production wiring is complete.",
    "These updates are foundational rather than flashy. They reduce operational ambiguity, make failures easier to diagnose, and keep the system usable during setup. The result is a cleaner path from local trial to live deployment without requiring architecture changes.",
  ].join("\n\n");
}

function summaryC(): string {
  return [
    "The architectural direction remains single-app first: ingest and digest orchestration stay in the main app, while worker ingestion remains optional through authenticated endpoints. This preserves low operational cost and keeps deployment options flexible for hobby and production tiers.",
    "Configuration structure has been simplified to map directly to real decisions: data source mode, summarizer provider, and destination database. This reduces accidental misconfiguration and helps users reason about what is required versus optional at each stage.",
    "Security and operability are now being treated as defaults instead of add-ons. Upcoming focus includes stronger cron origin validation, cleaner key lifecycle guidance, and clearer fallback states so users can distinguish between missing config and transient backend issues.",
  ].join("\n\n");
}

export function getDemoDigests(): Digest[] {
  return [
    {
      id: 900001,
      date: dayKey(0),
      title: "Reliability and setup UX improved across digest pipeline",
      created_at: isoMinutesAgo(10),
      summary: summaryA(),
      topics: ["Reliability", "Setup", "UX"],
      status: "completed",
      source: "demo",
      idempotency_key: null,
      worker_run_id: null,
      metadata: {
        fetchedCount: 48,
        uniqueCount: 32,
        newCount: demoTweetsA.length,
        seenCount: 24,
        demoTweets: demoTweetsA,
      },
    },
    {
      id: 900002,
      date: dayKey(0),
      title: "Idempotency and prefetch changes reduced friction in daily runs",
      created_at: isoMinutesAgo(110),
      summary: summaryB(),
      topics: ["Idempotency", "Performance", "Quality"],
      status: "completed",
      source: "demo",
      idempotency_key: null,
      worker_run_id: null,
      metadata: {
        fetchedCount: 36,
        uniqueCount: 22,
        newCount: demoTweetsB.length,
        seenCount: 16,
        demoTweets: demoTweetsB,
      },
    },
    {
      id: 900003,
      date: dayKey(0),
      title: "Single-app architecture remains primary with optional worker extension",
      created_at: isoMinutesAgo(250),
      summary: summaryC(),
      topics: ["Architecture", "Security", "Configuration"],
      status: "completed",
      source: "demo",
      idempotency_key: null,
      worker_run_id: null,
      metadata: {
        fetchedCount: 18,
        uniqueCount: 12,
        newCount: demoTweetsC.length,
        seenCount: 8,
        demoTweets: demoTweetsC,
      },
    },
    {
      id: 900004,
      date: dayKey(1),
      title: "Yesterday: ingestion guardrails cut invalid runs and improved consistency",
      created_at: isoMinutesAgo(1620),
      summary: summaryB(),
      topics: ["Validation", "Reliability"],
      status: "completed",
      source: "demo",
      idempotency_key: null,
      worker_run_id: null,
      metadata: {
        fetchedCount: 34,
        uniqueCount: 21,
        newCount: demoTweetsB.length,
        seenCount: 13,
        demoTweets: demoTweetsB,
      },
    },
    {
      id: 900005,
      date: dayKey(1),
      title: "Yesterday: config UX clarified source, summarizer, and storage choices",
      created_at: isoMinutesAgo(1860),
      summary: summaryC(),
      topics: ["Configuration", "UX"],
      status: "completed",
      source: "demo",
      idempotency_key: null,
      worker_run_id: null,
      metadata: {
        fetchedCount: 20,
        uniqueCount: 14,
        newCount: demoTweetsC.length,
        seenCount: 7,
        demoTweets: demoTweetsC,
      },
    },
  ];
}

export function getLatestDemoDigest(): Digest {
  return getDemoDigests()[0];
}
