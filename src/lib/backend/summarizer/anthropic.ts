const DEFAULT_MODEL = "claude-haiku-4-5";

export async function summarizeWithAnthropic(input: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  apiKey?: string;
  model?: string;
}): Promise<string> {
  const apiKey = input.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required.");
  }

  const model = DEFAULT_MODEL;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: input.maxTokens,
      temperature: input.temperature,
      system: input.systemPrompt,
      messages: [{ role: "user", content: input.userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Anthropic response missing content.");
  }

  return text;
}
