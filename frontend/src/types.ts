export type MessageRole = 'user' | 'bot'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: string
}

export interface ChatResponse {
  messages: ChatMessage[]
  sessionId?: string
}

export interface SendMessageResponse {
  message: ChatMessage
  sessionId?: string
}

export interface ClearChatResponse {
  success: boolean
}
