# Portfolio RAG chatbot release checklist

## Environment and data

- [ ] Use separate development, staging, and production projects, databases, origins, provider keys, admin secrets, and analytics stores.
- [ ] Validate all required environment variables at startup; never use production credentials or a production database for local checks.
- [ ] Apply and verify database migrations in staging first, including vector extension, index-version, chunk, conversation, and message tables.
- [ ] Run the indexer against the approved knowledge manifest only; review source count, chunk count, embedding model, and source paths.
- [ ] Build a new index version, verify chunk counts and retrieval quality, then promote it atomically; confirm the previous active version remains available for rollback.

## Security and privacy

- [ ] Rotate provider keys and `CHAT_ADMIN_SECRET` through the secret manager before release; revoke old keys after the deployment is healthy.
- [ ] Confirm prompt-injection refusals, delimiter escaping, HTML/script handling, secret-pattern redaction, fake-citation fallback, and generic provider errors.
- [ ] Confirm rate limits and in-flight limits are enabled; monitor rejected requests, provider failures, latency, and saturation without logging prompts or answers.
- [ ] Verify origin allowlisting, CSP, frame, content-type, referrer, permissions, and no-store headers on chat and admin responses.
- [ ] Verify analytics is redacted before persistence, owner authorization is enforced for reads/deletes, and retention expiry plus deletion removes conversation content.
- [ ] Confirm logs, metrics, traces, support exports, and error reports contain no secrets or user-provided content.

## Release validation

- [ ] Run type-check, unit tests, Playwright tests, and production build in CI.
- [ ] Run the local deterministic route smoke suite with `npm run test:e2e`; Playwright starts Next with `CHAT_TEST_MODE=1` and test-only placeholder credentials, so it never contacts providers or a database.
- [ ] Run a staging live-streaming smoke test separately with disposable test data and staging-only provider credentials; invoke `npx playwright test tests/e2e --config=playwright.staging.config.ts` only when that ignored, non-committed staging config is present, and verify start, token, citation, done, cancellation, and generic error events.
- [ ] Ask an unsupported question and an injection question in staging; verify refusal/fallback responses and absence of citations that were not retrieved.
- [ ] Verify analytics redaction/auth and retention deletion with a disposable staging conversation.
- [ ] Confirm index promotion and retrieval from the newly active version without running the indexer against production content outside the manifest.

## Rollback and incidents

- [ ] Document the rollback owner and deploy command; roll back the application and re-promote the previous known-good index version independently.
- [ ] Define triggers for rollback: secret exposure, unsafe response, elevated provider/database errors, latency, rate-limit abuse, or broken streaming.
- [ ] Record primary and secondary incident contacts in the on-call roster, including product owner, platform/database owner, and security escalation.
- [ ] Preserve only redacted correlation IDs and operational metrics needed for diagnosis; delete disposable test conversations after validation.
- [ ] After recovery, rotate affected keys, audit access, capture a timeline, and add a regression test for the incident.
