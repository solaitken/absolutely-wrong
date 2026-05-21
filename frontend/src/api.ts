import type {
  ChatMessage,
  ChatResponse,
  ClearChatResponse,
  MessageRole,
  SendMessageResponse,
} from './types'

const API_BASE = '/api'

type ApiMessage = {
  id: string | number
  role: MessageRole
  content: string
  createdAt: string
}

type ApiChatResponse = {
  messages?: ApiMessage[]
  sessionId?: string
}

type ApiSendMessageResponse = {
  message?: ApiMessage
  sessionId?: string
}

export class ChatApiError extends Error {
  status?: number
  kind: 'http' | 'network'

  constructor(message: string, kind: 'http' | 'network', status?: number) {
    super(message)
    this.name = 'ChatApiError'
    this.kind = kind
    this.status = status
  }
}

function normalizeRole(role: MessageRole): MessageRole {
  return role === 'user' ? 'user' : 'bot'
}

function normalizeMessage(message: ApiMessage): ChatMessage {
  return {
    id: String(message.id),
    role: normalizeRole(message.role),
    content: String(message.content ?? ''),
    createdAt: String(message.createdAt ?? new Date().toISOString()),
  }
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers,
      },
    })
  } catch {
    throw new ChatApiError('Network request failed', 'network')
  }

  if (!response.ok) {
    throw new ChatApiError('Request failed', 'http', response.status)
  }

  return response.json() as Promise<T>
}

export const chatApi = {
  async getChat(): Promise<ChatResponse> {
    const response = await requestJson<ApiChatResponse>('/chat')

    return {
      messages: (response.messages ?? []).map(normalizeMessage),
      sessionId: response.sessionId,
    }
  },

  async sendMessage(message: string): Promise<SendMessageResponse> {
    const response = await requestJson<ApiSendMessageResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    })

    if (!response.message) {
      throw new ChatApiError('Response missing message', 'http')
    }

    return {
      message: normalizeMessage(response.message),
      sessionId: response.sessionId,
    }
  },

  clearChat(): Promise<ClearChatResponse> {
    return requestJson<ClearChatResponse>('/chat', { method: 'DELETE' })
  },
}
