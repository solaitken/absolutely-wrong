# Contributing to Absolutely Wrong

Thanks for being wrong enough to contribute.

## Getting started

1. Fork and clone the repo.
2. Follow the [local development guide](README.md#local-development) in the README.
3. Create a branch: `git checkout -b your-feature`

## Code style

- **TypeScript strict mode** — no `any` without a good reason.
- **Components are dumb.** Keep state in `App.tsx`; components receive props and call callbacks.
- **CSS over JS.** Animations and layout belong in `.css` files, not in JS.
- **Mobile-first.** All new UI must work at 320px width.

## Commit convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(backend): add LlmProvider abstraction
fix(frontend): avatar not loading on mobile
docs: add local dev instructions
```

## Before submitting

- [ ] `npx tsc --noEmit` passes (backend and frontend)
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Tested on a real mobile device (320px width)

## Architecture notes

### Adding a new LLM provider

1. Implement the `LlmProvider` interface (`backend/src/llm/types.ts`).
2. Add your implementation file (e.g., `llm/openai.ts`).
3. Register it in `backend/src/index.ts`.

The abstraction is designed to make provider swaps a one-line change.

### Design system

All visual decisions follow `DESIGN.md`. Before changing colours, typography, or spacing:

1. Read `DESIGN.md` — it's the contract.
2. If your change doesn't fit the "arrogant, warm-dark, reading-room" vibe, reconsider.
3. Update `DESIGN.md` if the contract genuinely needs to change.

### Error handling

Errors must stay **in character**. Never show "Oops, something went wrong" — the bot should deliver bad news in its own voice.

## Questions?

Open an issue. The bot will probably disagree with it anyway.
