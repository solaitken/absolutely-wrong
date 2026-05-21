# Absolutely Wrong — Design

> Last updated: 2026-05-21
> Scope: visual + interaction contract for the chat SPA. Not implementation. No JSX, no CSS. Tokens and prose.
> Read alongside: `docs/about.md` (vision), `docs/specs.md` (requirements), `docs/architecture.md` (system).

## Mini-brainstorm (resolved)

Brainstorm was run solo against `docs/about.md`, `docs/specs.md`, `docs/architecture.md`. No live orchestrator clarification was available (subagent context). Open questions were resolved with defaults that match the product voice (arrogant, sarcastic, mentor-like) and the technical constraints (single screen, mobile-first, no streaming, ≤200 KB gzipped bundle).

| # | Question | Resolved default | Why |
|---|---|---|---|
| Q1 | Dark, light, or both themes? | **Dark-only.** | The bot's voice is condescending and theatrical. Dark surface fits the persona, halves design surface, and avoids a toggle that no MVP user will use. |
| Q2 | Typography pairing? | **Serif headline + system sans body.** Newsreader (display, weight 500–600) for the bot name/header and bot replies; system UI sans (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif`) for user messages, input, and metadata. | Serif reads "professor lecturing you" — leans into the arrogance. System sans on body keeps the bundle small (no body web font), preserves OS legibility on small screens. |
| Q3 | Density? | **Comfortable, not cramped.** 16 px base, 4 px spacing grid, generous vertical rhythm between bubbles (12 px gap, 24 px between author switches). Single column, 100% width up to 640 px, max content width 560 px on tablet+. | Mobile-first; the bot's lectures need room to breathe so each sentence lands. |
| Q4 | Iconography? | **Minimal, only three icons total**: send (▲ paper-plane), clear-chat (small ✕ in header), typing indicator (three pulsing dots, no icon — animated text). Stroke-only, 1.5 px, currentColor. | Three icons keeps the bundle small and the visual noise low. The bot's words are the content; icons should not compete. |
| Q5 | Error/empty/loading tone? | **In-character, never apologetic.** Errors are bot dialogue, not system chrome. Empty state mocks the user for not arguing yet. Loading is silent except for the three-dot typing indicator. | Breaking character into "Oops, something went wrong!" would kill the joke on every failure. The bot must stay in role even when the server is down. |

## 1. Visual identity

**One-line:** a dim, slightly old-fashioned reading room where a smug academic in a tailored jacket waits to tell you you're wrong about everything.

**Mood adjectives:** confident, dry, mildly theatrical, restrained, anti-friendly. Never cute, never neon, never "fun" in a Discord/Slack sense.

**What it is not:**

- Not a cyberpunk terminal. No green-on-black, no glitch effects, no monospace body.
- Not a friendly assistant chat. No rounded pastels, no smiling robot, no gradients.
- Not minimalist Apple Notes. The bot has a face and a presence; pure white space would erase the persona.

**Reference vibe:** the comment section of a literary review, set after dark.

## 2. Color tokens

Dark theme only. All tokens are semantic; raw hex listed once.

### Surfaces

| Token | Value | Purpose |
|---|---|---|
| `--surface-bg` | `#0E0D0B` | Page background. Near-black, warm-shifted (not pure `#000`). |
| `--surface-raised` | `#1A1815` | Bot message bubble background. One step up from page. |
| `--surface-input` | `#161410` | Input field background. Slightly inset feel. |
| `--surface-border` | `#2A2722` | Hairline dividers, input border at rest. 1 px. |

### Foreground

| Token | Value | Purpose |
|---|---|---|
| `--text-primary` | `#F2EDE3` | Body text on dark surfaces. Warm off-white, not `#FFF`. |
| `--text-secondary` | `#A89E8A` | Timestamps, "typing…", header subline, placeholder text. |
| `--text-muted` | `#6B6358` | Disabled state, metadata that should recede. |
| `--text-on-accent` | `#0E0D0B` | Text placed on the accent fill (send button). |

### Accent

| Token | Value | Purpose |
|---|---|---|
| `--accent` | `#C8A968` | Single accent: muted gold. Send button fill, focus ring, link underline. |
| `--accent-hover` | `#D8B978` | Hover/active state on accent surfaces. |
| `--accent-quiet` | `#3A2E1A` | Accent-on-surface (e.g. focus halo at 20% opacity equivalent). |

Gold was chosen over typical SaaS blue or AI-chat lavender to reinforce the "old academic" register. It is the only chromatic accent in the entire app.

### Bubbles

| Token | Value | Purpose |
|---|---|---|
| `--bubble-bot-bg` | `--surface-raised` | Bot message background. |
| `--bubble-bot-text` | `--text-primary` | Bot message body text. |
| `--bubble-user-bg` | `transparent` | User messages have no fill — text only, right-aligned. |
| `--bubble-user-text` | `--text-secondary` | Deliberately quieter than the bot. The bot dominates visually. |
| `--bubble-user-border` | `--surface-border` | 1 px left border on user message, color of divider. |

**Asymmetry is intentional.** The bot speaks in filled bubbles with an avatar; the user's words are border-less, slightly faded, indented. This visually frames every exchange as *the bot's stage, the user as guest*.

### Semantic states

| Token | Value | Purpose |
|---|---|---|
| `--state-error` | `--text-primary` on `--surface-raised` | Error messages render as bot messages — no red. See §6. |
| `--state-focus` | `--accent` | Focus ring color, 2 px outline, offset 2 px. |
| `--state-disabled` | `--text-muted` | Send button when input is empty. |

There is no `--state-success`, no `--state-warning`. The app has no positive feedback to celebrate.

## 3. Typography

### Fonts

- **Display / bot voice**: `Newsreader` (Google Fonts, subset to Latin + Latin-ext, weights 500 and 600 only). Self-hosted, woff2, ~22 KB compressed.
- **UI / user voice**: system sans stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif`. No web font for body — saves bundle.
- **Monospace**: not used.

### Scale (16 px base)

| Token | Size / line-height | Family | Usage |
|---|---|---|---|
| `--type-header` | 20 / 28 | Newsreader 600 | App header: bot name. |
| `--type-subheader` | 13 / 18 | system sans 400 | Header subline ("Always wrong, always sure"). |
| `--type-bot-message` | 17 / 26 | Newsreader 500 | Bot reply body. Slightly larger than UI so the bot literally speaks louder. |
| `--type-user-message` | 15 / 22 | system sans 400 | User message body. |
| `--type-input` | 16 / 22 | system sans 400 | Input field text. 16 px prevents iOS auto-zoom. |
| `--type-meta` | 12 / 16 | system sans 400 | Timestamps, "typing…" |
| `--type-button` | 14 / 20 | system sans 500 | Send button label (icon-only on mobile; "Send" on tablet+). |

### Rules

- Letter-spacing default. No "tracking out" headers.
- No italic anywhere except a single pointed exception: bot's empty-state taunt (see §6).
- No uppercase headlines. The persona is condescending, not shouting.
- Hyphenation: off. Word-break: normal. Long URLs in bot replies wrap at character boundaries.

## 4. Layout & spacing

**Spacing grid:** 4 px. All spacing tokens are multiples of 4.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4 px | Tightest gap (icon-to-text inside button). |
| `--space-2` | 8 px | Avatar-to-bubble gap, input internal padding. |
| `--space-3` | 12 px | Between consecutive messages, same author. |
| `--space-4` | 16 px | Bubble internal padding, page horizontal gutter on mobile. |
| `--space-6` | 24 px | Between author switches (user → bot). |
| `--space-8` | 32 px | Above input area, below header. |

**Frame:**

- Single column.
- Mobile (≤640 px): full-width, 16 px horizontal gutter.
- Tablet+ (>640 px): content centered, max-width 560 px, 24 px gutter.
- Header is sticky top; input is sticky bottom; message list scrolls between them.
- No sidebar, no tabs, no settings panel.

**Radii:**

- Bot bubbles: 14 px on three corners, 4 px on bottom-left (the "tail" corner, near avatar).
- Input field: 12 px.
- Buttons: 8 px (clear-chat), full pill for send button (24 px radius).
- No drop shadows. Depth comes from background contrast and the 1 px borders.

## 5. Component anatomy

Each component lists its parts, states, and the tokens it uses. No code.

### 5.1 App header

**Parts:**

1. Bot name: "Absolutely Wrong" (Newsreader 600, `--type-header`, `--text-primary`).
2. Subline: "Always wrong, always sure." (`--type-subheader`, `--text-secondary`).
3. Clear-chat affordance (icon-only `✕`, top-right, `--text-secondary`, becomes `--text-primary` on hover).

**Behavior:**

- Sticky to viewport top.
- Background: `--surface-bg` with a 1 px bottom border in `--surface-border`.
- Height: 56 px on mobile, 64 px on tablet+.

### 5.2 Message bubble — bot

**Parts:**

1. Avatar: 32 × 32 px, square with 6 px radius, left-aligned. WebP, served from frontend assets. Same image for every bot message.
2. Bubble: filled with `--bubble-bot-bg`, text `--type-bot-message`, padding `--space-4`, max-width 85% of column.
3. Optional timestamp: `--type-meta`, `--text-muted`, shown only on the last message of an author run, below the bubble, 4 px gap.

**Layout:**

- Avatar and bubble share a row. Avatar is vertically aligned to the top of the bubble (not centered) so multi-line replies anchor cleanly.
- When the previous message is also from the bot, hide the avatar and keep the gap (visual continuity of "the same speaker talking").

### 5.3 Message bubble — user

**Parts:**

1. No avatar.
2. Text only — no fill. `--bubble-user-text` color, `--type-user-message`.
3. 2 px left border in `--surface-border`, 12 px left padding.
4. Right-aligned within the column; max-width 80%.

**Rationale:** by removing the user's fill, the bot's bubbles dominate the visual hierarchy. The user is "quoted into" the bot's space.

### 5.4 Typing indicator

**Parts:**

- Bot avatar (same as a normal bot message).
- Three small dots (6 px circles, 4 px gap, `--text-secondary`) inside a `--bubble-bot-bg` bubble at normal padding.
- Dots pulse opacity 0.3 → 1 → 0.3, staggered 0, 150, 300 ms, 1200 ms cycle.

**Visibility rule:** appears the moment the user's message is sent; disappears the instant a reply arrives, an error fallback renders, or the request times out.

### 5.5 Input area

**Parts:**

1. Container: full-width, sticky bottom, `--surface-bg`, 1 px top border in `--surface-border`, padding `--space-3`.
2. Textarea: auto-growing 1 → 4 lines, then scrolls. `--surface-input` fill, 1 px `--surface-border` at rest, `--type-input` text, `--text-primary`.
   - Placeholder: "Say something wrong." (`--text-secondary`).
3. Send button: pill, fill `--accent`, label/icon `--text-on-accent`. Mobile: icon-only (▲, 16 px, paper-plane variant). Tablet+: "Send" label, 14 px, weight 500.

**States:**

- Empty input → send button uses `--state-disabled` and is not focusable.
- Focused input → border becomes `--accent`, no shadow change.
- Submitting → send button shows the icon dimmed, input is read-only, focus stays in the textarea.

**Keyboard:**

- `Enter` sends.
- `Shift+Enter` inserts a newline.
- `Escape` clears the current draft.

### 5.6 Avatar

- Single static SVG image, served from `/bot-avatar.svg`.
- 128 × 128 px source, served at 32 × 32 px display.
- Subject: a simplified character with crossed arms, raised eyebrow, condescending smirk. Warm dark palette matching the theme.
- Treated as decorative (alt text: empty string). The bot's name in the header carries identity for screen readers.

### 5.7 Header clear-chat control

- Hit target: 44 × 44 px (min), icon visually 16 × 16 px.
- Confirmation: **none.** Clicking it clears immediately. The bot doesn't ask permission for anything; neither does its UI.
- After clear: the chat returns to empty state (§6).

### 5.8 Error message (in-character)

- Renders as a bot message bubble (same anatomy as §5.2).
- No icon, no red, no "Error" label.
- Body text uses normal `--type-bot-message`.
- Indistinguishable from a real reply except by content. See §7 for copy.

## 6. Interaction primitives

### Focus

- All interactive elements show a 2 px outline in `--state-focus`, offset 2 px, no border-radius inheritance (a square halo around pill buttons is intentional and visible).
- Outline is visible for keyboard focus only (`:focus-visible` semantic). Mouse clicks do not show the ring.
- No focus-within decoration on bubbles — they are not interactive.

### Hover

- Send button: fill shifts to `--accent-hover`.
- Clear-chat icon: color shifts from `--text-secondary` to `--text-primary`.
- Bubbles: no hover state.
- On touch devices: hover states must not "stick" after tap. All hover affordances also have a matching `:active` state with the same visual.

### Active / pressed

- Buttons: scale to 0.98 for 80 ms on press, no color change beyond the existing hover shift.

### Loading

- Only one loading affordance exists: the typing indicator (§5.4).
- No spinners, no progress bars, no skeleton screens.
- Initial history fetch on page load shows nothing — if there's no history, the empty state appears; if there is, messages render once available. A brief blank moment is acceptable for ≤200 KB and one query.

### Empty state

- Triggered when message list is empty (first visit, or after Clear chat).
- Renders one centered bot message in the middle of the message area (not at top), no avatar.
- Copy: *"Go ahead. Try to be right about something."* (italic, `--type-bot-message`, `--text-secondary`).
- This is the only italic text in the entire app.

### Error state

- Same bubble anatomy as a normal bot message. See §7 for copy variants.

### Rate-limit state

- Same bubble anatomy as a normal bot message; copy from spec FR / NFR.

### Disabled state

- Only the send button has a disabled state (when input is empty).
- Visual: `--state-disabled` color for the icon, no fill change. Cursor: `default`.
- Not focusable in this state.

## 7. Micro-copy

The bot's voice is condescending but never insulting; sarcastic but never crude; certain but never enthusiastic. Errors and edge cases are dialogue lines, not system messages.

### Voice rules

1. **Never apologize.** No "sorry", no "oops".
2. **Never use exclamation marks** anywhere in the UI or bot output.
3. **Never use "simply" or "just"** to describe user actions or recovery steps.
4. **Never use emoji.**
5. **Never break the fourth wall to admit something is broken.** A 500 is the bot "needing a break", not a system failure.
6. **Always short.** No micro-copy is longer than 12 words.

### Static UI strings

| Surface | Copy |
|---|---|
| Header title | `Absolutely Wrong` |
| Header subline | `Always wrong, always sure.` |
| Input placeholder | `Say something wrong.` |
| Send button label (tablet+) | `Send` |
| Clear-chat tooltip | `Erase the evidence` |
| Empty state | `Go ahead. Try to be right about something.` |

### Dynamic / state copy

| Trigger | Copy (rendered as bot bubble) |
|---|---|
| LLM timeout / 5xx | `Even I need a break. Try again.` |
| Rate limit (429) | `Slow down. Even I have limits.` |
| Validation: message empty | (handled client-side; send button is disabled — no copy needed) |
| Validation: message > 2000 chars | `That's too much wrong for one breath. Cut it down.` |
| Network unreachable | `Your connection's wrong too. Try again.` |
| Cleared chat (transient toast — do not implement; rely on empty state instead) | — |

### Accessibility text (screen reader only)

- Avatar: empty alt — decorative.
- Send button (icon-only on mobile): `aria-label="Send message"`.
- Clear-chat: `aria-label="Clear conversation"`.
- Typing indicator: `aria-live="polite"`, announced as `"Bot is composing a reply"`.
- Bot bubbles: `role="article"`, prefixed by `aria-label="Absolutely Wrong replied"` (hidden visually).
- Error bubbles use the same role; the screen-reader text is identical to the visible copy — the in-character framing applies to both audiences.

## 8. Motion

**Policy: minimal, in-character, and skipped under `prefers-reduced-motion: reduce`.**

| Surface | Motion | Duration | Easing |
|---|---|---|---|
| New message appears | Fade in opacity 0 → 1, plus 4 px upward translate | 180 ms | ease-out |
| Typing indicator | Per-dot opacity pulse, staggered 150 ms | 1200 ms loop | ease-in-out |
| Send button press | Scale to 0.98 | 80 ms | linear |
| Focus ring | Instant. No animation. | — | — |
| Hover color shift | Instant. No transition. | — | — |
| Empty state appearance | Fade only, no translate | 240 ms | ease-out |
| Error bubble appearance | Same as new message — error must look like dialogue, not an interruption | 180 ms | ease-out |

**No** scroll-into-view animations beyond the browser default; **no** parallax; **no** confetti, ever; **no** route transitions (single page).

`prefers-reduced-motion: reduce` collapses all of the above to instant changes except the typing indicator, which becomes a static "…" with no pulse.

## 9. Accessibility minimums

- All text on background must clear WCAG AA contrast (4.5:1 body, 3:1 large). Token pairs above were chosen with this in mind.
- All interactive elements have a hit target of at least 44 × 44 px.
- Focus order: header (skip-link target) → message list → input → send → clear-chat.
- A visually-hidden skip-link at the top reads `Skip to input` and jumps to the textarea — useful on long histories.
- Color is never the only signal. The bot/user distinction is carried by avatar, alignment, font family, and ARIA labels — not by color alone.

## 10. What this contract does not cover

- Concrete CSS values, class names, file structure — those belong to implementation.
- Streaming/SSE — out of scope per `docs/specs.md`. If added later, design must extend §5.4 to handle progressive message rendering.
- Light theme — explicitly deferred. Adding it would require revisiting tokens in §2 and the asymmetric bubble treatment in §5.2/§5.3.
- PWA install / splash — open question in `docs/specs.md`; deferred.
- Multilingual UI — copy in §7 is English only; localization is out of scope for MVP.

## 11. Open design questions

1. **Avatar generation source** — single hand-curated image vs. a single AI-generated portrait baked into the repo. Tracked in `docs/architecture.md` open questions.
2. **Cross-author gap on touch** — 24 px between author switches reads well on mobile, but bot/user/bot/user volleys may feel airy on small screens. Revisit after real device testing.
3. **Newsreader subset** — confirm Latin + Latin-ext is enough; add Cyrillic subset only if bot replies are observed using Cyrillic characters (current product copy is English).
4. **Empty-state delay** — render the empty taunt immediately on first paint, or wait 200 ms to avoid flash on history-fetch race? Empirically test post-MVP.
