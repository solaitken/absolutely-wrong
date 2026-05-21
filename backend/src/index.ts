import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { callGLM } from './glm';
import {
  getSession,
  createSession,
  touchSession,
  insertMessage,
  getMessages,
  deleteMessages,
  deleteSession,
} from './db';

const app = new Hono();

// CORS — only allow the frontend origin
app.use('/*', cors({
  origin: 'https://absolutely-wrong.techmeat.dev',
  credentials: true,
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// CSP headers
app.use('/*', async (c, next) => {
  await next();
  c.res.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'");
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
});

// In-memory rate limiter (20 req/min per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 20) {
    return false;
  }

  entry.count++;
  return true;
}

// Periodic cleanup of rate limit map
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 60_000);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get chat history
app.get('/api/chat', (c) => {
  const sessionId = c.req.header('Cookie')?.match(/sessionId=([^;]+)/)?.[1];

  if (!sessionId || !uuidValidate(sessionId)) {
    return c.json({ messages: [], sessionId: null }, 200);
  }

  const session = getSession.get(sessionId) as any;
  if (!session) {
    return c.json({ messages: [], sessionId: null }, 200);
  }

  touchSession.run(sessionId);
  const messages = getMessages.all(sessionId) as Array<{
    id: number;
    role: string;
    content: string;
    created_at: string;
  }>;

  return c.json({
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.created_at,
    })),
    sessionId,
  });
});

// Send message and get bot response
app.post('/api/chat', async (c) => {
  // Rate limit check
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Slow down. Even I have limits.' }, 429);
  }

  let body: { message?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const userMessage = body.message?.trim();
  if (!userMessage || userMessage.length < 1 || userMessage.length > 2000) {
    return c.json({ error: 'Message must be 1–2000 characters.' }, 400);
  }

  // Session management
  let sessionId = c.req.header('Cookie')?.match(/sessionId=([^;]+)/)?.[1];
  let isNewSession = false;

  if (!sessionId || !uuidValidate(sessionId)) {
    sessionId = uuidv4();
    isNewSession = true;
  }

  const session = getSession.get(sessionId) as any;
  if (!session) {
    createSession.run(sessionId);
    isNewSession = true;
  } else {
    touchSession.run(sessionId);
  }

  // Save user message
  insertMessage.run(sessionId, 'user', userMessage);

  // Call GLM-5.1
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'Even I need a break. Try again.' }, 500);
  }

  let botResponse: string;
  try {
    botResponse = await callGLM(userMessage, apiKey);
  } catch (err: any) {
    console.error('GLM error:', err.message);
    botResponse = 'Even I need a break. Try again.';
  }

  // Save bot response
  insertMessage.run(sessionId, 'bot', botResponse);

  // Set session cookie
  const response = c.json({
    message: {
      id: Date.now(),
      role: 'bot',
      content: botResponse,
      createdAt: new Date().toISOString(),
    },
    sessionId,
  });

  if (isNewSession) {
    response.headers.set(
      'Set-Cookie',
      `sessionId=${sessionId}; HttpOnly; SameSite=Strict; Secure; Path=/; Max-Age=604800`
    );
  }

  return response;
});

// Clear chat history
app.delete('/api/chat', (c) => {
  const sessionId = c.req.header('Cookie')?.match(/sessionId=([^;]+)/)?.[1];

  if (!sessionId || !uuidValidate(sessionId)) {
    return c.json({ success: true }, 200);
  }

  deleteMessages.run(sessionId);
  deleteSession.run(sessionId);

  const response = c.json({ success: true });
  response.headers.set(
    'Set-Cookie',
    'sessionId=; HttpOnly; SameSite=Strict; Secure; Path=/; Max-Age=0'
  );

  return response;
});

// Start server
const PORT = parseInt(process.env.PORT || '30000', 10);

serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`Absolutely Wrong backend running on port ${PORT}`);
