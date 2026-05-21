# Absolutely Wrong — Specifications

## Overview

Absolutely Wrong — пародийное одностраничное веб-приложение в виде чата. Пользователь пишет любое утверждение, а AI-бот (GLM-5.1) отвечает безапелляционным несогласием в надменном менторском тоне. Пародия на мем «you're absolutely right» от Anthropic, вывернутая наоборот.

Приложение полностью анонимно: ни регистрации, ни авторизации, ни сбора PII. Всё состояние держится в браузерной сессии (httpOnly cookie) и SQLite на сервере. MVP — один чат, одна сессия, поле ввода и лента сообщений. Никакой практической пользы — чистый юмор.

**Stack**: React (Vite) + Hono.js (Node.js) + SQLite (better-sqlite3) + GLM-5.1 (api.z.ai).  
**Хостинг**: поддомен `absolutely-wrong.techmeat.dev` на VPS, деплой через GitHub Actions по SSH.  
**Репозиторий**: публичный, `solaitken/absolutely-wrong`.

## Use cases

### UC-1: Отправить сообщение и получить ответ-несогласие

**As a visitor, I want to send a message to the bot so that I receive an absurdly confident disagreement in response.**

1. Пользователь открывает `https://absolutely-wrong.techmeat.dev`
2. Видит пустой чат с аватаркой бота и полем ввода
3. Вводит любое утверждение (например, «The sky is blue»)
4. Отправляет сообщение
5. Сообщение появляется в ленте (справа, как исходящее)
6. Индикатор «печатает…» показывается слева
7. Бот отвечает сообщением-несогласием (слева, с аватаркой)
8. История сохраняется и отображается при обновлении страницы (в рамках сессии)

### UC-2: Очистить историю чата

**As a visitor, I want to clear the chat history so that I can start a fresh argument with the bot.**

1. Пользователь нажимает кнопку «Clear chat»
2. Все сообщения текущей сессии удаляются из ленты и из БД
3. Чат возвращается к пустому состоянию

### UC-3: Обработка ошибки LLM

**As a visitor, I want the app to handle LLM failures gracefully so that I'm not left staring at a broken page.**

1. Пользователь отправляет сообщение
2. Запрос к GLM-5.1 падает (timeout >15s, сетевая ошибка, 5xx)
3. Вместо ответа бота появляется сообщение-заглушка: «Even I need a break. Try again.»
4. Пользователь может повторить отправку

### UC-4: Rate limit

**As a visitor, I want the app to enforce rate limits so that I know when I'm arguing too much.**

1. Пользователь отправляет >20 запросов в минуту с одного IP
2. На 21-й запрос возвращается HTTP 429 с сообщением: «Slow down. Even I have limits.»
3. Фронтенд показывает это сообщение как ответ бота

## Functional requirements

### FR-1: Чат-интерфейс

- Одностраничное приложение (SPA) на React + Vite
- Mobile-first адаптивная вёрстка (корректное отображение на экранах от 320px)
- Поле ввода текста с кнопкой отправки (или Enter)
- Лента сообщений: сообщения пользователя справа, бота — слева с аватаркой
- Индикатор «печатает…» (три точки) во время ожидания ответа
- Кнопка «Clear chat» для сброса истории

### FR-2: Аватарка бота

- Статическое изображение (сгенерированное), отображается рядом с каждым сообщением бота
- Формат: PNG или WebP, оптимизированный размер

### FR-3: Отправка сообщений

- POST `/api/chat` — принимает `{ "message": "<текст>", "sessionId": "<uuid>" }`
- Валидация: `message` — непустая строка, максимум 2000 символов
- Возвращает `{ "reply": "<ответ бота>", "sessionId": "<uuid>" }`
- Таймаут вызова GLM-5.1: 15 секунд

### FR-4: Системный промпт бота

- Бот получает системный промпт, enforcing надменный, безапелляционный тон
- Бот всегда не соглашается — независимо от содержания сообщения пользователя
- Тон: менторский, самоуверенный, пассивно-агрессивный, но не оскорбительный
- Формат ответа: plain text, без маркдауна

### FR-5: История чата

- Сообщения сохраняются в SQLite с привязкой к `sessionId`
- При загрузке страницы фронтенд запрашивает историю: `GET /api/chat?sessionId=<uuid>`
- История возвращается в хронологическом порядке

### FR-6: Очистка истории

- Кнопка «Clear chat» отправляет `DELETE /api/chat?sessionId=<uuid>`
- Удаляет все сообщения сессии из БД
- Фронтенд очищает ленту

### FR-7: Создание сессии

- При первом посещении бекенд устанавливает httpOnly cookie `sessionId` (UUID v4)
- Если cookie уже есть, используется существующая сессия
- Время жизни сессии: 7 дней с последней активности

## Non-functional requirements

### NFR-1: Производительность

- Время ответа (p95): <5 секунд от отправки до появления ответа (без учёта времени GLM-5.1)
- Поддержка до 50 одновременных пользователей в MVP
- Размер бандла фронтенда: <200 KB gzipped (включая аватарку)

### NFR-2: Надёжность

- При недоступности GLM-5.1: показывать fallback-сообщение, не крашить сервер
- При ошибке БД: логировать, возвращать 500, не терять входящее сообщение (отображать как отправленное)
- Graceful degradation: если БД недоступна — чат работает без истории (in-memory only)

### NFR-3: Безопасность

- Валидация и санитизация входных данных (XSS prevention)
- CORS: разрешён только origin `https://absolutely-wrong.techmeat.dev`
- Content Security Policy (CSP) headers
- Rate limiting: 20 запросов/минуту с одного IP (in-memory счётчик в Hono)
- httpOnly cookie для sessionId (недоступна из JavaScript)

### NFR-4: Приватность

- Никаких PII не собирается и не хранится
- IP-адреса не логируются и не хранятся
- Единственная cookie — функциональная (sessionId), не требует GDPR-баннера
- История сообщений хранится временно: автоочистка сессий старше 7 дней
- Сообщения не передаются третьим сторонам (кроме api.z.ai для генерации ответа)

### NFR-5: Поддерживаемость

- Монорепозиторий: `frontend/` и `backend/` в одном репозитории
- Весь код и документация на английском
- Логирование ошибок в stdout/stderr (systemd journal)

## Interfaces / API

### POST /api/chat

Отправка сообщения и получение ответа.

**Request**:
```json
{
  "message": "The sky is blue",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation**:
- `message`: required, string, 1–2000 chars
- `sessionId`: required, string, UUID v4 format

**Response 200**:
```json
{
  "reply": "Wrong. The sky isn't blue — it's a social construct...",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response 429** (rate limit):
```json
{
  "error": "Slow down. Even I have limits."
}
```

**Response 400** (validation):
```json
{
  "error": "Message must be between 1 and 2000 characters"
}
```

**Response 500** (LLM/DB error):
```json
{
  "error": "Even I need a break. Try again."
}
```

### GET /api/chat

Получение истории сообщений сессии.

**Query params**: `sessionId=<uuid>`

**Response 200**:
```json
{
  "messages": [
    { "role": "user", "content": "The sky is blue", "timestamp": "2026-05-21T12:00:00Z" },
    { "role": "bot", "content": "Wrong. It's clearly cerulean...", "timestamp": "2026-05-21T12:00:03Z" }
  ],
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### DELETE /api/chat

Очистка истории сессии.

**Query params**: `sessionId=<uuid>`

**Response 200**:
```json
{
  "ok": true
}
```

### CORS

- Allowed origin: `https://absolutely-wrong.techmeat.dev`
- Allowed methods: GET, POST, DELETE
- Allowed headers: Content-Type
- Credentials: true (for cookie)

## Data model

### SQLite: таблица `messages`

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'bot')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_messages_session ON messages(session_id, created_at);
```

### SQLite: таблица `sessions`

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,  -- UUID v4
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Очистка старых сессий

При старте сервера и периодически (раз в час):
```sql
DELETE FROM messages WHERE session_id IN (
  SELECT id FROM sessions WHERE last_active_at < datetime('now', '-7 days')
);
DELETE FROM sessions WHERE last_active_at < datetime('now', '-7 days');
```

### Session cookie

- Имя: `sessionId`
- Значение: UUID v4
- Флаги: `HttpOnly; SameSite=Strict; Secure; Path=/; Max-Age=604800` (7 дней)

## External dependencies

| Зависимость | Назначение | Критичность |
|---|---|---|
| `api.z.ai` (GLM-5.1) | Генерация ответов бота | Критическая — без неё бот не работает |
| GitHub (solaitken/absolutely-wrong) | Хостинг кода, CI/CD | Высокая — деплой зависит от Actions |
| VPS / Caddy | Хостинг и reverse proxy | Критическая |
| npm-пакеты (React, Vite, Hono, better-sqlite3) | Рантайм и сборка | Критическая — заморожены в lock-файлах |

## Dependency versions

Актуальные версии на 2026-05-21, проверены через `npm view <pkg> version`:

### Runtime

| Пакет | Версия | Источник |
|---|---|---|
| Node.js | ≥22 LTS (v24.15.0 на сервере) | https://nodejs.org |
| `react` | ^19.2.6 | `npm view react version` |
| `react-dom` | ^19.2.6 | парная с react |
| `vite` | ^8.0.14 | `npm view vite version` |
| `@vitejs/plugin-react` | ^6.0.2 | `npm view @vitejs/plugin-react version` |
| `hono` | ^4.12.21 | `npm view hono version` |
| `@hono/node-server` | ^2.0.3 | `npm view @hono/node-server version` |
| `better-sqlite3` | ^12.10.0 | `npm view better-sqlite3 version` |

### Dev

| Пакет | Версия | Источник |
|---|---|---|
| `typescript` | ^6.0.3 | `npm view typescript version` |
| `vitest` | ^4.1.7 | `npm view vitest version` |
| `@types/react` | ^19.2.15 | `npm view @types/react version` |
| `@types/better-sqlite3` | ^7.6.13 | `npm view @types/better-sqlite3 version` |
| `jsdom` | ^29.1.1 | `npm view jsdom version` |
| `@testing-library/react` | ^16.4.0 | `npm view @testing-library/react version` |
| `@testing-library/jest-dom` | ^6.9.1 | `npm view @testing-library/jest-dom version` |
| `@testing-library/user-event` | ^14.6.1 | `npm view @testing-library/user-event version` |

### External service

| Сервис | Версия/Идентификатор | Источник |
|---|---|---|
| GLM-5.1 (Z.ai) | `glm-5.1` (модель) | https://api.z.ai/api/coding/paas/v4/ |

Все версии зафиксированы с caret-диапазоном (^) в `package.json`. Точные версии заморожены в `package-lock.json` / `bun.lockb`.

## Out of scope

Всё, что явно исключено из MVP (см. `about.md` NOT in the first version), плюс:

- **Авторизация / регистрация** — полностью анонимный доступ
- **Множественные чаты / сессии** — одна сессия на устройство
- **Шеринг / экспорт диалогов** — нет кнопок «поделиться»
- **Голосовой ввод** — только текст
- **Настройки личности бота** — один фиксированный тон
- **Аналитика / трекинг** — никаких счётчиков посещений
- **Админ-панель** — нет
- **Streaming ответов** — MVP отдаёт полный ответ сразу, не стримит токены
- **Резервное хранилище (бэкапы)** — не в MVP
- **Мониторинг / алертинг** — не в MVP, только системные логи

## Open questions

1. **Точный текст системного промпта** — будет определён при реализации. Должен обеспечивать: всегда несогласие, надменный менторский тон, без оскорблений, без маркдауна.

2. **Дизайн аватарки** — нужна ли одна статичная или несколько вариантов? Сгенерировать заранее или динамически?

3. **Деплой-скрипт** — `platform deploy` для hono-runtime: нужна ли сборка TypeScript/бандлинг на сервере или CI пакует готовый `dist/`?

4. **Мобильный PWA** — добавлять ли manifest.json и service worker для «установки на домашний экран» в MVP или позже?
