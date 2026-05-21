/**
 * GLM-5.1 provider via api.z.ai.
 */

import type { LlmConfig, LlmMessage, LlmProvider } from './types';
import { LlmError } from './types';

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

export function createGLMProvider(config: LlmConfig): LlmProvider {
  const apiUrl = config.baseUrl.replace(/\/$/, '');

  return {
    name: 'GLM-5.1',

    async chat(messages: LlmMessage[]): Promise<string> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const response = await fetch(`${apiUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...messages,
            ],
            max_tokens: 256,
            temperature: 0.9,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.status >= 500) {
          throw new LlmError(
            `GLM API error ${response.status}`,
            'api_5xx',
            response.status,
          );
        }

        if (response.status >= 400) {
          throw new LlmError(
            `GLM API error ${response.status}`,
            'api_4xx',
            response.status,
          );
        }

        const data = (await response.json()) as GLMResponse;
        return (
          data.choices[0]?.message?.content ||
          "I can't even be bothered to respond to that."
        );
      } catch (err: unknown) {
        clearTimeout(timeout);

        if (err instanceof LlmError) throw err;

        const error = err as Error;
        if (error.name === 'AbortError') {
          throw new LlmError('GLM timeout', 'timeout');
        }

        // Network errors (fetch failed, DNS, connection refused, etc.)
        throw new LlmError(
          `Network error: ${error.message}`,
          'network',
        );
      }
    },
  };
}
