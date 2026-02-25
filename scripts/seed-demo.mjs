import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://neondb_owner:npg_ET2kQSNntVo6@ep-solitary-paper-agfs0i6t-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

const TWEETS_PER_DIGEST = 5;
const EXPECTED_ACCOUNT_COUNT = 9;
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
];

const digests = [
  {
    hoursAgo: 1,
    title: "Inference Pricing Drops, Cache Hits Improve, and Team Agents Get More Practical",
    summary: `Several AI infra teams shipped quiet but meaningful updates overnight. RiverByte AI dropped pricing for its small reasoning model by roughly 30%, while keeping latency stable according to customer traces. Developers reported that this makes nightly batch evals and staging checks much cheaper.

SynthCloud rolled out cache-aware routing to all regions, and early screenshots suggest noticeably higher cache hit rates for repeated prompts in support and analytics workloads. Northstar Data also published a benchmark thread showing token throughput gains after moving long-context retrieval to a chunked prefetch path.

On the product side, StackPilot launched a "background patch" agent that opens low-risk pull requests while engineers are offline. LoopForge followed with a release that lets teams replay failed agent runs step-by-step, making incident review less opaque. The common theme: lower cost plus better observability is finally making autonomous workflows easier to trust.`,
    topics: ["AI Infra", "Inference", "Caching", "Developer Tools", "Agents"],
    source: "twitter_api",
    tweets: [
      { handle: "riverbyte_ai", text: "Shipping today: RB-small-2 pricing down 31% with no SLA changes. Batch eval costs should drop immediately for most teams." },
      { handle: "synthcloud", text: "Cache-aware routing now enabled globally. Median cache hit rate in prod tenants moved from 22% -> 39%." },
      { handle: "northstar_data", text: "Ran 50M-token replay on chunked prefetch path. Same quality, faster tail latency, fewer timeout retries." },
      { handle: "stackpilot", text: "Background Patch agent is live. It opens low-risk refactor PRs overnight with test evidence attached." },
      { handle: "loopforge", text: "New in LoopForge: run replay. Step through every tool call from a failed agent job in one timeline view." },
    ],
  },
  {
    hoursAgo: 4,
    title: "Agent IDEs Add Async Workflows, Frameworks Focus on Stream Reliability",
    summary: `Developer tooling conversations centered on reliability rather than raw model quality today. DevLane HQ published a post about moving from synchronous agent loops to queue-backed background tasks, reducing timeout failures on large codebase scans.

ShipyardDev and StackPilot both shipped updates around resumable tool streams, allowing long-running code actions to survive tab refreshes and transient network issues. QuillOps added schema-locked outputs for CI checks, which helps teams fail fast when agent output shape drifts.

Microfeed Lab benchmarked three frontend stacks on streaming UI updates and found that rendering strategy mattered more than model choice for perceived responsiveness. The broader takeaway across threads: teams are now optimizing the whole agent runtime path, not just prompt quality.`,
    topics: ["Agent IDE", "Streaming", "Reliability", "Frontend DX", "CI"],
    source: "twitter_api",
    tweets: [
      { handle: "devlanehq", text: "Moved our coding agents to queue-backed async jobs. Timeout-related failures dropped 44% this week." },
      { handle: "shipyarddev", text: "Resumable stream sessions are now default in Shipyard. Refresh-safe tool calls were overdue." },
      { handle: "stackpilot", text: "Structured event logs for every tool call now land in CI artifacts. Debugging is much faster." },
      { handle: "quillops", text: "Schema-locked JSON mode is live for QuillOps checks. Deterministic payloads make pipeline gating simpler." },
      { handle: "microfeed_lab", text: "Streaming UI benchmark: render strategy impacted perceived speed more than model selection in all 3 test apps." },
    ],
  },
  {
    hoursAgo: 7,
    title: "Open-Weight Models Tighten the Gap While Serving Tooling Matures",
    summary: `Open model teams posted a wave of updates focused on practical deployment. RiverByte AI released a 22B instruction model with better multilingual eval scores and clearer guardrail behavior under function-calling prompts.

Northstar Data shared a serving note on mixed precision + speculative decoding that reduced p95 inference latency for interactive chat without sacrificing output quality on internal tests. LoopForge compared orchestration stacks and found graph-based planners easier to inspect during failures than linear chains.

At the same time, SynthCloud released a one-click eval harness for side-by-side model comparison on organization-specific traces. The release threads reflected a steady shift from benchmark bragging toward deployment discipline and incident transparency.`,
    topics: ["Open Models", "Serving", "Latency", "Model Eval", "Orchestration"],
    source: "twitter_api",
    tweets: [
      { handle: "riverbyte_ai", text: "RB-22B-Instruct released. Better multilingual tool-calling accuracy and tighter refusal behavior in unsafe prompts." },
      { handle: "northstar_data", text: "Speculative decoding + mixed precision cut p95 chat latency by 27% in our serving cluster." },
      { handle: "loopforge", text: "Tested 4 orchestration patterns in prod. Graph planners gave the best failure visibility by far." },
      { handle: "synthcloud", text: "Eval Harness v2 now supports side-by-side model runs on your own trace exports in <15 minutes." },
      { handle: "shipyarddev", text: "Function-calling router now retries with constraint hints before fallback. Fewer malformed payloads in staging." },
    ],
  },
  {
    hoursAgo: 12,
    title: "Usage Billing APIs Grow Up, Teams Move Away From Custom Metering",
    summary: `Billing and metering became a hot topic as more teams moved agent features from beta to paid plans. QuillOps introduced event-based usage webhooks with replay protection, and several founders posted migration threads away from handwritten billing code.

Microfeed Lab published a detailed analysis showing that 80% of billing incidents came from delayed aggregation jobs rather than incorrect token counts. In response, DevLane HQ released real-time counters with minute-level drift alerts.

Northstar Data highlighted how usage visibility changed customer behavior: once teams saw cost by workflow, they started tuning prompts, caching, and model tiering much more aggressively. The discussion indicates pricing infrastructure is now a core product surface, not a back-office concern.`,
    topics: ["AI Billing", "Metering", "Pricing Ops", "SaaS", "FinOps"],
    source: "twitter_api",
    tweets: [
      { handle: "quillops", text: "Metering webhooks now include replay tokens + idempotency keys. This should end duplicate usage rows." },
      { handle: "microfeed_lab", text: "After 4 weeks of incident review, delayed aggregation jobs caused most billing surprises, not token math." },
      { handle: "devlanehq", text: "Real-time usage counters shipped with per-minute drift alerts. Support tickets dropped right away." },
      { handle: "northstar_data", text: "Customers trimmed spend 18% after seeing cost by workflow. Visibility changed behavior faster than discounts." },
      { handle: "synthcloud", text: "Added usage export endpoints so finance teams can reconcile model spend without custom scripts." },
    ],
  },
  {
    hoursAgo: 18,
    title: "Product Teams Push AI Features Internationally, UX Simplification Leads Roadmaps",
    summary: `Multiple SaaS teams announced international rollouts for AI features, but localization quality and compliance support varied widely. StackPilot expanded assistant features to seven new regions and published a transparency report on data residency.

ShipyardDev shared a redesign focused on reducing UI complexity in agent-driven workflows. Their team removed nested configuration paths and replaced them with task presets, which reportedly improved first-time completion rates in onboarding sessions.

Meanwhile, Microfeed Lab noted that teams with clearer "automation confidence" indicators saw better retention than teams shipping more model options. Product threads suggest users increasingly care about predictability and explainability over raw capability counts.`,
    topics: ["Product Rollout", "Localization", "UX", "Retention", "SaaS"],
    source: "twitter_api",
    tweets: [
      { handle: "stackpilot", text: "Assistant rollout now live in 7 more regions with residency controls + translated audit logs." },
      { handle: "shipyarddev", text: "Removed 11 advanced toggles from onboarding and replaced with presets. Completion rate improved 19%." },
      { handle: "microfeed_lab", text: "Users keep asking for confidence indicators, not more model dropdowns. Predictability wins." },
      { handle: "riverbyte_ai", text: "Localization patch: better tokenization for mixed-language prompts and fewer truncation bugs." },
      { handle: "quillops", text: "Compliance panel now surfaces retention policy + region mapping before any job is submitted." },
    ],
  },
  {
    hoursAgo: 27,
    title: "Open Governance Discussions Intensify Around Model Documentation Requirements",
    summary: `Policy and platform teams spent the day discussing lightweight governance standards for open model releases. DevLane HQ proposed a release checklist format covering training data provenance ranges, intended use cases, and known failure modes.

LoopForge shared a template for incident disclosures after model regressions, arguing that postmortems should include prompt classes and evaluation deltas. Northstar Data advocated for publishing benchmark variance, not just top-line averages.

Although no single standard emerged, the conversation moved toward practical documentation that engineering teams can maintain without blocking iteration speed. Threads from founders and infra leads converged on one point: trust improves when tradeoffs are explicit.`,
    topics: ["AI Governance", "Model Cards", "Reliability", "Evaluation", "Policy"],
    source: "twitter_api",
    tweets: [
      { handle: "devlanehq", text: "Drafted a release checklist: provenance range, eval spread, known failure classes, rollback plan." },
      { handle: "loopforge", text: "If you ship model updates weekly, incident templates are mandatory. Fast iteration needs fast disclosure." },
      { handle: "northstar_data", text: "Please publish variance, not only mean score. Regression risk hides in tails." },
      { handle: "quillops", text: "Started attaching compact model cards to every production deploy artifact. It helps audit readiness." },
      { handle: "synthcloud", text: "Added eval-delta summaries to deployment logs so product teams see changes before rollout." },
    ],
  },
  {
    hoursAgo: 36,
    title: "DX Releases Focus on Build Speed, Type Safety, and Better Agent Feedback Loops",
    summary: `The developer-experience timeline was dominated by practical releases: faster type checks, cleaner agent diagnostics, and stronger test feedback loops. ShipyardDev announced a build runner update that parallelizes static checks across packages with better cache reuse.

StackPilot published a patch making generated code suggestions include failure reason tags when tests break, reducing time spent re-prompting. DevLane HQ rolled out a compact review mode where AI comments cluster by risk category instead of file order.

Microfeed Lab surveyed 120 engineering teams and found that the best predictor of AI adoption was not model spend, but confidence in debugging and rollback workflows. Teams that could inspect agent decisions were significantly more likely to keep automation enabled.`,
    topics: ["Developer Experience", "Type Safety", "Testing", "Agent Debugging", "Productivity"],
    source: "twitter_api",
    tweets: [
      { handle: "shipyarddev", text: "Build runner now parallelizes static checks per package and reuses cache metadata across branches." },
      { handle: "stackpilot", text: "Generated patches now include failure tags from test output so retries are targeted, not blind." },
      { handle: "devlanehq", text: "AI review mode now groups comments by risk class (security, reliability, style) instead of file order." },
      { handle: "microfeed_lab", text: "Survey result: trust in rollback tooling predicted automation adoption better than model quality scores." },
      { handle: "loopforge", text: "New trace panel links each agent decision to the exact test run and diff snapshot." },
    ],
  },
  {
    hoursAgo: 48,
    title: "Infra Spend Rebalances Toward Efficiency, Orchestration Stacks Consolidate",
    summary: `Infrastructure teams reported a noticeable shift from capacity expansion to efficiency tuning this week. Northstar Data shared internal numbers showing that routing by request class cut blended inference cost while preserving response quality.

RiverByte AI and SynthCloud both released updates around multi-tenant scheduling, prioritizing latency-sensitive workloads while backfilling bulk jobs. Meanwhile, LoopForge published migration guides for teams moving from ad hoc scripts to unified orchestration pipelines.

The consensus across threads was pragmatic: fewer frameworks, better defaults, stronger observability. Teams appear less interested in experimental abstractions and more focused on reducing operational surprises in production agent systems.`,
    topics: ["AI Infrastructure", "Cost Optimization", "Orchestration", "Scheduling", "Observability"],
    source: "twitter_api",
    tweets: [
      { handle: "northstar_data", text: "Routing requests by class (chat, batch, eval) reduced blended inference cost 14% in production." },
      { handle: "riverbyte_ai", text: "Multi-tenant scheduler update: latency-sensitive lanes now preempt batch with bounded fairness windows." },
      { handle: "synthcloud", text: "Backfill queue now auto-tunes concurrency from real-time GPU pressure signals." },
      { handle: "loopforge", text: "Published a migration guide from script-based orchestration to graph pipelines with audit-friendly traces." },
      { handle: "quillops", text: "Orchestration policy checks now run before execution start, not after first tool call." },
    ],
  },
];

// Generate fake but plausible tweet IDs (19-digit snowflake-style)
let tweetIdCounter = 1890000000000000000n;
function nextTweetId() {
  tweetIdCounter += 1000000n;
  return tweetIdCounter.toString();
}

async function seed() {
  const client = await pool.connect();
  try {
    if (ACCOUNT_HANDLES.length !== EXPECTED_ACCOUNT_COUNT) {
      throw new Error(
        `Expected ${EXPECTED_ACCOUNT_COUNT} fake accounts but got ${ACCOUNT_HANDLES.length}.`
      );
    }

    const allowedHandles = new Set(ACCOUNT_HANDLES);
    const usedHandles = new Set(digests.flatMap((d) => d.tweets.map((t) => t.handle)));
    if (usedHandles.size !== EXPECTED_ACCOUNT_COUNT) {
      throw new Error(
        `Expected ${EXPECTED_ACCOUNT_COUNT} unique handles in seeded tweets, got ${usedHandles.size}.`
      );
    }

    await client.query(`ALTER TABLE digests ADD COLUMN IF NOT EXISTS latest_tweet_id TEXT`);

    // Clear existing seeded data to allow re-running
    await client.query(`DELETE FROM digests WHERE source IN ('twitter_api', 'home_timeline') AND metadata::text LIKE '%"seeded":true%'`);

    for (const d of digests) {
      if (d.tweets.length !== TWEETS_PER_DIGEST) {
        throw new Error(
          `Digest "${d.title}" must have exactly ${TWEETS_PER_DIGEST} tweets (got ${d.tweets.length}).`
        );
      }

      for (const tweet of d.tweets) {
        if (!allowedHandles.has(tweet.handle)) {
          throw new Error(`Digest "${d.title}" has unknown handle "${tweet.handle}".`);
        }
      }

      const createdAt = new Date(Date.now() - d.hoursAgo * 60 * 60 * 1000).toISOString();
      const metadata = JSON.stringify({ title: d.title, fetchedCount: d.tweets.length, newCount: d.tweets.length, uniqueCount: d.tweets.length, seenCount: 0, seeded: true });
      const topics = JSON.stringify(d.topics);

      // Insert digest, get ID back
      const { rows: [{ id: digestId }] } = await client.query(
        `INSERT INTO digests (summary, topics, status, source, metadata, created_at)
         VALUES ($1, $2::jsonb, 'completed', $3, $4::jsonb, $5)
         RETURNING id`,
        [d.summary, topics, d.source, metadata, createdAt]
      );

      // Insert tweets and link to digest
      let latestTweetId = null;
      for (let i = 0; i < d.tweets.length; i++) {
        const t = d.tweets[i];
        const tweetId = nextTweetId();
        latestTweetId = tweetId;
        const tweetUrl = `https://x.com/${t.handle}/status/${tweetId}`;
        const tweetTime = new Date(Date.parse(createdAt) - (d.tweets.length - i) * 5 * 60 * 1000).toISOString();

        await client.query(
          `INSERT INTO tweets (id, text, author_handle, timestamp, url)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT(id) DO NOTHING`,
          [tweetId, t.text, t.handle, tweetTime, tweetUrl]
        );

        await client.query(
          `INSERT INTO digest_tweets (digest_id, tweet_id, position, is_new)
           VALUES ($1, $2, $3, true)
           ON CONFLICT (digest_id, tweet_id) DO NOTHING`,
          [digestId, tweetId, i + 1]
        );
      }

      if (latestTweetId) {
        await client.query(`UPDATE digests SET latest_tweet_id = $1 WHERE id = $2`, [
          latestTweetId,
          digestId,
        ]);
      }

      console.log(`✓ Inserted digest #${digestId} with ${d.tweets.length} tweets: ${d.title.slice(0, 55)}...`);
    }

    const { rows } = await client.query(`SELECT COUNT(*) FROM digests WHERE status = 'completed'`);
    console.log(`\nTotal digests in DB: ${rows[0].count}`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => { console.error(err); process.exit(1); });
