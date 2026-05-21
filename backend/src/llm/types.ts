/**
 * LLM provider interface.
 * All providers must implement this contract.
 * Add new providers by implementing `LlmProvider` and registering in `index.ts`.
 */

export type LlmRole = 'system' | 'user' | 'assistant';

export interface LlmMessage {
  role: LlmRole;
  content: string;
}

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export type LlmErrorKind = 'timeout' | 'network' | 'api_5xx' | 'api_4xx' | 'unknown';

export class LlmError extends Error {
  kind: LlmErrorKind;
  status?: number;

  constructor(message: string, kind: LlmErrorKind, status?: number) {
    super(message);
    this.name = 'LlmError';
    this.kind = kind;
    this.status = status;
  }
}

export interface LlmProvider {
  /** Human-readable provider name (e.g. "GLM-5.1") */
  readonly name: string;

  /**
   * Send a chat completion request.
   * @param messages - Conversation history (system + user messages)
   * @returns The assistant's reply text.
   * @throws {LlmError} with a typed `kind` for fallback messaging.
   */
  chat(messages: LlmMessage[]): Promise<string>;
}
