import {
  getDigestByIdempotencyKey,
  getTotalDigestCount,
  saveDigest,
  saveDigestTweetLinks,
  upsertTweets,
  type StoredTweet,
} from "@/lib/backend/db/repository";

const TWEETS_PER_DIGEST = 5;
const EXPECTED_ACCOUNT_COUNT = 9;
const DEMO_SEED_VERSION = "v1";
const DEMO_SOURCE = "twitter_api";

const ACCOUNT_HANDLES = [
  "riverbyte_ai",
  "stackpilot",
  "quillops",
  "microfeed_lab",
  "northstar_data",
  "shipyarddev",
  "devlanehq",
  "synthcloud",
  "loopforge",
] as const;

interface DemoTweetTemplate {
  handle: string;
  text: string;
}

interface DemoDigestTemplate {
  hoursAgo: number;
  title: string;
  summary: string;
  topics: string[];
  tweets: DemoTweetTemplate[];
}

const DEMO_DIGESTS: DemoDigestTemplate[] = [
  {
    hoursAgo: 1,
    title: "Inference Pricing Drops, Cache Hits Improve, and Team Agents Get More Practical",
    summary:
      "Several AI infra teams shipped meaningful updates overnight. Pricing moved down for smaller reasoning models while cache-aware routing raised hit rates in repetitive support and analytics workloads. Developers also highlighted better replay tooling for failed agent runs, making incident review less opaque and reducing re-run time.",
    topics: ["AI Infra", "Inference", "Caching", "Agents", "Developer Tools"],
    tweets: [
      {
        handle: "riverbyte_ai",
        text: "RB-small-2 pricing is down 31% starting now. Same SLA, lower nightly eval cost.",
      },
      {
        handle: "synthcloud",
        text: "Cache-aware routing is now global. Median cache hit rate climbed from 22% to 39%.",
      },
      {
        handle: "northstar_data",
        text: "Chunked prefetch path replayed 50M tokens with better p95 and fewer retries.",
      },
      {
        handle: "stackpilot",
        text: "Background Patch agent is live with low-risk refactor PRs + test evidence.",
      },
      {
        handle: "loopforge",
        text: "Run Replay now shows every tool call in order, with inputs/outputs side-by-side.",
      },
    ],
  },
  {
    hoursAgo: 4,
    title: "Agent IDEs Move Async, Stream Reliability Becomes the Main DX Priority",
    summary:
      "Developer teams are shifting to queue-backed async agent execution to reduce timeout failures on large repositories. Resumable streams, schema-locked outputs, and structured CI logs are helping teams debug agent behavior without digging through raw traces.",
    topics: ["Agent IDE", "Streaming", "Reliability", "CI", "DX"],
    tweets: [
      {
        handle: "devlanehq",
        text: "Moved coding agents to queue-backed jobs. Timeout-related failures dropped 44%.",
      },
      {
        handle: "shipyarddev",
        text: "Resumable stream sessions are default now. Refresh-safe tool calls were overdue.",
      },
      {
        handle: "stackpilot",
        text: "Structured tool-call logs now attach to CI artifacts for every agent run.",
      },
      {
        handle: "quillops",
        text: "Schema-locked JSON output mode is live for policy and pipeline checks.",
      },
      {
        handle: "microfeed_lab",
        text: "Streaming UI benchmark: render strategy mattered more than model choice.",
      },
    ],
  },
  {
    hoursAgo: 7,
    title: "Serving Discipline Beats Benchmark Hype in Open-Model Release Threads",
    summary:
      "Open-model teams focused on deployment reliability rather than headline benchmarks. Mixed precision and speculative decoding updates improved interactive latency while preserving response quality in internal tests.",
    topics: ["Open Models", "Serving", "Latency", "Orchestration", "Eval"],
    tweets: [
      {
        handle: "riverbyte_ai",
        text: "RB-22B-Instruct released with stronger multilingual tool-calling behavior.",
      },
      {
        handle: "northstar_data",
        text: "Speculative decoding + mixed precision cut p95 chat latency by 27%.",
      },
      {
        handle: "loopforge",
        text: "Graph planners gave us the clearest failure visibility in production.",
      },
      {
        handle: "synthcloud",
        text: "Eval Harness v2 supports side-by-side runs on your own trace exports.",
      },
      {
        handle: "shipyarddev",
        text: "Function-calling router now retries with constraints before fallback.",
      },
    ],
  },
  {
    hoursAgo: 12,
    title: "Usage Billing Matures as AI Features Move from Beta to Paid Plans",
    summary:
      "Teams are replacing custom billing scripts with event-based metering and reconciliation workflows. Real-time counters and drift alerts are reducing support tickets, while usage-by-workflow views are driving fast cost optimization decisions.",
    topics: ["AI Billing", "Metering", "FinOps", "SaaS", "Pricing Ops"],
    tweets: [
      {
        handle: "quillops",
        text: "Metering webhooks now include replay tokens and idempotency keys.",
      },
      {
        handle: "microfeed_lab",
        text: "Most billing incidents came from delayed aggregation, not token math.",
      },
      {
        handle: "devlanehq",
        text: "Real-time usage counters with drift alerts are live in all paid plans.",
      },
      {
        handle: "northstar_data",
        text: "Customers cut spend 18% after seeing model cost by workflow.",
      },
      {
        handle: "synthcloud",
        text: "Usage export endpoints now simplify finance-side reconciliation.",
      },
    ],
  },
];

let inFlightDemoSeed: Promise<boolean> | null = null;

function nextDemoTweetId(digestIndex: number, tweetIndex: number): string {
  const base = 1895000000000000000n;
  const stride = BigInt(digestIndex * 100 + tweetIndex + 1);
  return (base + stride).toString();
}

function validateDemoTemplates(): void {
  if (ACCOUNT_HANDLES.length !== EXPECTED_ACCOUNT_COUNT) {
    throw new Error(
      `Demo seed expected ${EXPECTED_ACCOUNT_COUNT} accounts, got ${ACCOUNT_HANDLES.length}.`
    );
  }

  const allowedHandles = new Set<string>(ACCOUNT_HANDLES);
  const usedHandles = new Set<string>();
  for (const digest of DEMO_DIGESTS) {
    if (digest.tweets.length !== TWEETS_PER_DIGEST) {
      throw new Error(
        `Digest "${digest.title}" must have exactly ${TWEETS_PER_DIGEST} tweets.`
      );
    }
    for (const tweet of digest.tweets) {
      if (!allowedHandles.has(tweet.handle)) {
        throw new Error(
          `Digest "${digest.title}" has unknown handle "${tweet.handle}".`
        );
      }
      usedHandles.add(tweet.handle);
    }
  }

  if (usedHandles.size !== EXPECTED_ACCOUNT_COUNT) {
    throw new Error(
      `Demo seed expected ${EXPECTED_ACCOUNT_COUNT} unique handles in tweets, got ${usedHandles.size}.`
    );
  }
}

async function insertDemoDigests(): Promise<boolean> {
  const totalBefore = await getTotalDigestCount();
  if (totalBefore > 0) return false;

  validateDemoTemplates();
  let inserted = false;

  for (let digestIndex = 0; digestIndex < DEMO_DIGESTS.length; digestIndex += 1) {
    const digest = DEMO_DIGESTS[digestIndex];
    const idempotencyKey = `demo-seed-${DEMO_SEED_VERSION}-${digestIndex + 1}`;
    const existing = await getDigestByIdempotencyKey(idempotencyKey);
    if (existing) continue;

    const createdAt = Date.now() - digest.hoursAgo * 60 * 60 * 1000;
    const tweets: StoredTweet[] = digest.tweets.map((tweet, tweetIndex) => {
      const id = nextDemoTweetId(digestIndex, tweetIndex);
      const timestamp = new Date(
        createdAt - (TWEETS_PER_DIGEST - tweetIndex) * 5 * 60 * 1000
      ).toISOString();
      return {
        id,
        text: tweet.text,
        authorHandle: tweet.handle,
        timestamp,
        url: `https://x.com/${tweet.handle}/status/${id}`,
      };
    });

    const newTweetIds = new Set(tweets.map((tweet) => tweet.id));
    const latestTweetId = tweets.reduce<string | null>((latest, tweet) => {
      if (!latest) return tweet.id;
      return BigInt(tweet.id) > BigInt(latest) ? tweet.id : latest;
    }, null);

    try {
      await upsertTweets(tweets);
      const digestId = await saveDigest({
        summary: digest.summary,
        topics: digest.topics,
        status: "completed",
        source: DEMO_SOURCE,
        idempotencyKey,
        latestTweetId,
        metadata: {
          title: digest.title,
          fetchedCount: tweets.length,
          newCount: tweets.length,
          uniqueCount: tweets.length,
          seenCount: 0,
          seeded: true,
          demoSeedVersion: DEMO_SEED_VERSION,
        },
      });
      await saveDigestTweetLinks({
        digestId,
        allTweets: tweets,
        newTweetIds,
      });
      inserted = true;
    } catch (error: any) {
      if (error?.code === "23505") {
        continue;
      }
      throw error;
    }
  }

  return inserted;
}

export async function seedDemoDigestsIfEmpty(): Promise<boolean> {
  if (process.env.AUTO_SEED_DEMO === "false") return false;
  if (!inFlightDemoSeed) {
    inFlightDemoSeed = insertDemoDigests().finally(() => {
      inFlightDemoSeed = null;
    });
  }
  return inFlightDemoSeed;
}

