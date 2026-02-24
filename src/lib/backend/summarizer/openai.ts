const DEFAULT_MODEL = "gpt-4o-mini";

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

  const model = input.model || process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const baseUrl = (input.baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/+$/,
    ""
  );

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt },
      ],
    }),
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
