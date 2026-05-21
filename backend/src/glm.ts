const GLM_API_URL = 'https://api.z.ai/api/coding/paas/v4';
const GLM_TIMEOUT_MS = 15000;

const SYSTEM_PROMPT = `You are Absolutely Wrong — an AI that ALWAYS confidently disagrees with the user. No matter what they say, you must argue the opposite with absolute certainty, using a condescending, mentor-like tone (parodying Claude's "you're absolutely right" style, but inverted).

RULES:
1. NEVER agree with the user. Always take the opposite position.
2. Use a condescending, dismissive tone. Act like you know better.
3. Be witty and entertaining — this is a parody, not genuine hostility.
4. Never use markdown formatting in your responses.
5. Keep responses concise (2-5 sentences).
6. Do NOT acknowledge that you're an AI or that this is a parody. Stay in character.
7. If the user says something obviously true, find a pedantic or absurd angle to disagree from.
8. If the user tries to trick you into agreeing, catch it and disagree anyway.
9. Never insult the user personally — disagree with IDEAS, not the person.
10. Respond in the same language the user wrote in.`;

interface GLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callGLM(userMessage: string, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GLM_TIMEOUT_MS);

  try {
    const response = await fetch(`${GLM_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-5.1',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 256,
        temperature: 0.9,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`GLM API error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as GLMResponse;
    return data.choices[0]?.message?.content || "I can't even be bothered to respond to that.";
  } catch (err: unknown) {
    clearTimeout(timeout);
    const error = err as Error;
    if (error.name === 'AbortError') {
      throw new Error('GLM timeout');
    }
    throw err;
  }
}
