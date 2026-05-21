# Absolutely Wrong — Roadmap

> Last updated: 2026-05-21
> SDD: superpowers
> Read alongside: `docs/about.md` (vision), `docs/specs.md` (requirements), `docs/architecture.md` (system), `DESIGN.md` (visual contract)

## Guiding principles

1. **Ship the joke first.** MVP — работающий чат с надменным ботом. Всё остальное — потом.
2. **Mobile-first, dark-only.** Дизайн-контракт из DESIGN.md — закон. Никаких светлых тем, никаких десктоп-first вёрсток.
3. **Simple infrastructure.** SQLite, один процесс, никаких Redis/очередей/Docker. Собрал в CI → залил на VPS.
4. **Anonymous by design.** Без регистрации, без PII, httpOnly cookie для сессий. Приватность — не фича, а архитектурное решение.
5. **In-character always.** Даже ошибки и edge cases говорят голосом бота. Никаких «Oops, something went wrong» — только «Even I need a break».
6. **Build in CI, serve artifacts.** VPS не компилирует код. GitHub Actions собирает → rsync на сервер. Исключение: better-sqlite3 (ADR-005) перекомпилируется на сервере при деплое.

## Phases

### Phase 1 — Core Chat MVP

**Goal:** одностраничный чат, где бот (GLM-5.1) всегда надменно не соглашается с пользователем. Приложение доступно на `absolutely-wrong.techmeat.dev`.

**Implementation order** (последовательный с частичным параллелизмом):
1. Backend (Hono.js + SQLite) — приоритет, т.к. фронтенду нужен живой API для тестирования
2. Frontend (React + Vite) — можно начинать после реализации `POST /api/chat`

**Backend deliverables:**
- `backend/` — Hono.js 4.12.21, TypeScript 6.0.3, Node.js ≥22
- `POST /api/chat` — приём сообщения, вызов GLM-5.1, сохранение в SQLite, возврат ответа
- `GET /api/chat` — получение истории сообщений сессии
- `DELETE /api/chat` — очистка истории сессии
- `GET /api/health` — health-check
- SQLite: таблицы `sessions` и `messages` (см. `docs/architecture.md` §SQLite)
- Session management: httpOnly cookie `sessionId` (UUID v4, 7 дней), автоочистка старых сессий
- Rate limiting: 20 req/min per IP (in-memory, Hono middleware)
- Input validation: message 1–2000 chars, sessionId UUID v4
- Error handling: GLM timeout (15s) → fallback «Even I need a break»; DB error → 500 c graceful degradation
- CORS: только `https://absolutely-wrong.techmeat.dev`, credentials: true
- CSP headers
- CI: GitHub Actions workflow (`.github/workflows/deploy.yml`):
  - `npm ci && npx tsc` → `backend/dist/`
  - SSH deploy: rsync `dist/`, затем `npm ci --production && npm rebuild better-sqlite3` на сервере
  - Передача `GLM_API_KEY` из GitHub Secrets → `.env` на сервере
- Systemd unit: `proj-absolutely-wrong-backend.service`, запуск `node dist/index.js` на порту 30000

**Frontend deliverables:**
- `frontend/` — React 19.2.6, Vite 8.0.14
- SPA: один экран чата, mobile-first (320px+), max-width 560px на tablet+
- Компоненты (по DESIGN.md §5):
  - AppHeader: название бота, слоган, кнопка Clear chat
  - MessageList: лента сообщений с автоскроллом
  - BotBubble: аватарка + заполненный баббл (шрифт Newsreader, цвет `--bubble-bot-bg`)
  - UserBubble: текст без заливки, левая граница, выравнивание вправо
  - TypingIndicator: три пульсирующие точки в баббле бота
  - InputArea: auto-growing textarea + кнопка отправки
  - EmptyState: «Go ahead. Try to be right about something.» (единственный курсив в приложении)
- Аватарка бота: статичный WebP 64×64 (2×), соответствует DESIGN.md §5.6
- Шрифт Newsreader: self-hosted woff2, subset Latin+Latin-ext, веса 500 и 600
- Цветовые токены из DESIGN.md §2 — реализованы как CSS custom properties
- Анимации (DESIGN.md §8): fade-in для новых сообщений, pulse для typing indicator, press scale для кнопки
- Accessibility: skip-link, aria-labels, focus-visible, контраст AA
- Интеграция с API: fetch к бекенду, обработка 200/400/429/500
- Сессия: чтение sessionId из тела ответа (cookie httpOnly, фронтенд её не читает)
- CI: `npm ci && npx vite build` → `frontend/dist/`, rsync на сервер
- Сборка: ≤200 KB gzipped (с аватаркой и шрифтом)

**System deliverables:**
- Caddy: роутинг `/*` → `frontend/dist/`, `/api/*` → `localhost:30000` (`.platform.yaml` уже существует)
- Systemd unit для бекенда (создаётся `platform deploy`)
- Деплой: GitHub Actions workflow, триггер на push в `main`

**Done when:**
- Приложение доступно на `https://absolutely-wrong.techmeat.dev`
- Бот отвечает GLM-5.1 через `api.z.ai`
- Аватарка отображается, соответствует DESIGN.md
- Пользователь может отправить сообщение и получить надменный ответ
- Clear chat работает
- История сохраняется в рамках сессии (7 дней)
- Приложение работает на мобильных (320px+)
- Rate limiting активен (20 req/min)
- Ошибки GLM показывают in-character fallback
- Все тесты зелёные (~10–15 тестов: API contract + компоненты)
- Бандл фронтенда ≤200 KB gzipped

### Phase 2 — Polish

**Goal:** довести визуальное качество и надёжность до уровня «можно показывать друзьям». Phase 2 закрывает все компромиссы MVP.

**Prerequisite:** Phase 1 deployed and stable.

**Deliverables:**
- **Аватарка — финальная версия.** Если в Phase 1 был AI-сгенерированный портрет «с первой попытки» — заменить на тщательно отобранный или вручную отретушированный. Критерий: выражение лица читается на 32×32 px.
- **Типографика — тонкая настройка.** Кернинг Newsreader на мобильных, optical sizing, fallback-шрифты для Cyrillic (если бот использует кириллицу).
- **Анимации — доработка.** Плавный auto-scroll при появлении новых сообщений, transition на empty state → первый месседж.
- **Offline-резилентность.** Если бекенд недоступен — показывать сообщение «Your connection's wrong too.» без белого экрана.
- **Архитектура под смену LLM-провайдера.** Выделить LLM-клиент в абстракцию (интерфейс `LlmProvider`) с реализациями для GLM и fallback-провайдера. В Phase 2 — только рефакторинг без второго провайдера.
- **Fallback-сообщения — уточнение.** Разные формулировки для разных ошибок (timeout vs 5xx vs network error) вместо одного шаблона.
- **Документация кодовой базы.** README.md с инструкциями по локальному запуску, `CONTRIBUTING.md` (если репо публичное).
- **Lightweight мониторинг.** Health-check алерт (cron на VPS: curl `/api/health` раз в 5 минут, уведомление в Telegram при падении).

**Done when:**
- Аватарка финальная, читается на мобильных
- Анимации плавные, нет «дёрганий» при скролле
- Офлайн-режим не ломает страницу
- Код готов к добавлению второго LLM-провайдера (интерфейс, но без реализации)
- README.md объясняет, как развернуть локально
- Health-check мониторинг активен

### Phase 3 — Extras (опционально)

**Goal:** фичи, которые расширяют продукт за пределы MVP, но не являются критичными для юмора. **Активируется только если продукт набирает аудиторию и есть запрос от пользователей.**

**Candidate features** (в порядке потенциальной востребованности):

1. **Множественные сессии.** Возможность начать «новый спор» без потери старого. Переключение между сессиями в UI. Требует рефакторинга: `sessionId` → массив сессий, UI-переключатель.
2. **Шеринг диалогов.** Кнопка «поделиться» → генерирует ссылку на read-only view конкретного диалога. Серверный рендеринг или статичный снепшот в HTML.
3. **Streaming ответов (SSE).** Бот пишет ответ по словам, а не отдаёт пачкой. Требует: `POST /api/chat` → SSE, фронтенд — progressive rendering сообщения. Повышает perceived performance.
4. **Выбор «личности» бота.** Переключатель тона: «arrogant professor», «passive-aggressive colleague», «condescending parent». Каждый — свой системный промпт.
5. **PWA.** manifest.json + service worker, установка на домашний экран, офлайн-режим с кешированным UI.
6. **Голосовой ввод.** Web Speech API на фронтенде (браузерная фича, не требует бекенда). Кнопка микрофона рядом с полем ввода.

**Активация:** создать Kanban-задачу с assignee `product-tech-lead` для рескопа Phase 3 на основе реальной аналитики использования.

## Dependencies

| Dependency | Phase | Criticality | Mitigation if unavailable |
|---|---|---|---|
| GLM-5.1 (api.z.ai) | 1, 2, 3 | Critical | Fallback message «Even I need a break» |
| GitHub Actions | 1, 2, 3 | High | Manual deploy via `platform deploy` |
| VPS / Caddy | 1, 2, 3 | Critical | Нет mitigation — single point of failure |
| Newsreader font (Google Fonts) | 1, 2 | Medium | Self-hosted woff2 в репо → не зависит от Google CDN |
| npm registry | 1, 2, 3 | Low | `package-lock.json` + cache в CI |
| GitHub (репозиторий) | 1, 2, 3 | Medium | Локальные копии у разработчиков |

## Quality gates

Каждый phase должен пройти все гейты перед переходом к следующему:

### Gate: Code review
- PR проходит ревью (CodeRabbit или ручное)
- Нет критических находок (SQL-инъекции, XSS, утечка ключей)

### Gate: Tests pass
- Все существующие тесты зелёные
- Новый код покрыт тестами (минимум: критические пути)
- Phase 1: ≥10 тестов (API contract + ключевые компоненты)

### Gate: Design compliance
- Визуальное соответствие DESIGN.md (тёмная тема, шрифты, цвета, компоненты)
- Micro-copy соответствует голосу бота (DESIGN.md §7)
- Аватарка на месте, правильного размера

### Gate: Deploy and smoke test
- Приложение развёрнуто на `absolutely-wrong.techmeat.dev`
- Health-check: `GET /api/health` → 200
- Smoke test: отправить сообщение → получить надменный ответ
- Проверка на реальном мобильном устройстве (320px ширина)

### Gate: Performance
- Бандл фронтенда ≤200 KB gzipped (Phase 1)
- P95 latency ответа ≤5s (без учёта GLM)
- No console errors, no 404 на ресурсы

### Gate: Security
- CORS restricted to production origin
- CSP headers present
- httpOnly cookie, SameSite=Strict, Secure
- Нет логов с токенами/ключами
- Rate limiting активен

## Risks

| Risk | Likelihood | Impact | Mitigation | Phase |
|---|---|---|---|---|
| GLM-5.1 длительный downtime | Medium | High | Fallback-сообщение. Не блокирует запуск — юмор работает даже на заглушках | 1 |
| better-sqlite3 не компилируется на сервере | Low | High | Сервер имеет build-essential. Если нет — доустановить в CI деплой-скрипте | 1 |
| Newsreader не грузится (CORS/CDN) | Low | Low | Self-hosted в репо. Если woff2 битый — фоллбек на system serif (Georgia) | 1 |
| Caddy route conflict с существующими поддоменами | Low | Medium | `platform new` проверяет коллизии. Ручная проверка после деплоя | 1 |
| CI секреты не настроены | Medium | High | Документировать в README. При отсутствии — деплой вручную через `platform deploy` | 1 |
| Мобильная вёрстка ломается на реальных устройствах | Medium | Medium | Smoke test на реальном телефоне. Эмулятор Chrome DevTools — не истина | 1 |
| Rate limiter блокирует легитимных пользователей (NAT) | Low | Low | 20 req/min с IP — щедрый лимит для одного человека. Мониторить жалобы | 1 |
| SQLite corruption при kill -9 | Low | Low | WAL mode. Данные — развлекательные, потеря не критична | 1,2,3 |
| Рост диска от старых сессий | Low | Low | Автоочистка каждые час + при старте. 7-дневный TTL | 1,2,3 |
| Перерасход токенов GLM (злоупотребление API) | Low | Medium | Rate limiting + мониторинг биллинга Z.ai. Бесплатный тир — риск минимален | 1 |

## Out of scope for v1

(Дублирует `docs/about.md` NOT in the first version и `docs/specs.md` Out of scope — для полноты roadmap)

- Авторизация / регистрация
- Множественные чаты / сессии (кроме одной активной)
- Шеринг / экспорт диалогов
- Голосовой ввод
- Настройки личности бота
- Аналитика / трекинг
- Админ-панель
- Streaming ответов (SSE)
- Резервное копирование БД
- Мониторинг / алертинг (кроме health-check в Phase 2)
- PWA / установка на домашний экран
- Светлая тема
- Мультиязычность (только английский UI и ответы бота)
- CDN для статики (всё с одного origin)

## Open questions (logged from brainstorm)

| # | Question | Resolved | Rationale |
|---|---|---|---|
| Q1 | Аватарка: Phase 1 или Phase 2? | **Phase 1** | Specs.md success criteria: «Аватарка бота сгенерирована и отображается». DESIGN.md §5.6 детально описывает аватар — нет причин откладывать |
| Q2 | Параллельная или последовательная разработка? | **Бекенд первый, фронтенд после API** | API-контракт из specs.md позволяет независимую разработку, но фронтенду нужен живой эндпоинт для интеграции. Бекенд → `POST /api/chat` → фронтенд стартует |
| Q3 | Fallback LLM-провайдер? | **Заглушка в MVP, архитектура в Phase 2** | Для юмористического приложения in-character fallback-сообщение приемлемо. Рефакторинг под смену провайдера — в Phase 2 |
| Q4 | Phase 2 vs Phase 3 приоритет? | **Phase 2 сразу, Phase 3 опционально** | Полировать MVP важнее, чем добавлять фичи без аудитории. Phase 3 — только если продукт набирает пользователей |
| Q5 | Глубина тестирования? | **~10–15 тестов: API + компоненты** | Критические пути (API contract, LLM call, validation) + ключевые UI-компоненты. Не гонимся за coverage% в MVP |
