const DEFAULT_MODEL = "gpt-5-mini";
const REASONING_MODELS = new Set(["gpt-5-mini", "gpt-5", "o1", "o1-mini", "o3", "o3-mini"]);

export async function summarizeWithOpenAI(input: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}): Promise<string> {
  const apiKey = input.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required.");
  }

  const model = DEFAULT_MODEL;
  const baseUrl = (input.baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/+$/,
    ""
  );

  const isReasoning = REASONING_MODELS.has(model);

  const body: Record<string, unknown> = {
    model,
    max_completion_tokens: input.maxTokens,
    messages: [
      { role: "system", content: input.systemPrompt },
      { role: "user", content: input.userPrompt },
    ],
  };

  if (isReasoning) {
    body.reasoning_effort = "minimal";
  } else {
    body.temperature = input.temperature;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenAI response missing content.");
  }

  return text;
}
