# Chat Timing Logging Design

## Goal

Measure the time from prompt submission to the first response byte, first AI
token, and completed answer while preserving prompt and answer privacy.

## Design

- The client records `performance.now()` at prompt submission and logs timing
  milestones in the browser console.
- The server records `performance.now()` for each request and logs stage timing
  with the existing `correlationId`.
- Server logs identify only the request correlation ID, stage, and elapsed
  milliseconds. Prompt and answer content are never logged.
- Existing error and analytics behavior remains unchanged.

## Timing stages

Client:

- `prompt_sent`
- `first_response_byte`
- `first_token`
- `completed`

Server:

- `retrieval_completed`
- `first_token`
- `completed`

## Validation

- Type-check the project.
- Run the focused chat tests.
- Confirm log statements contain no prompt or answer payload.
