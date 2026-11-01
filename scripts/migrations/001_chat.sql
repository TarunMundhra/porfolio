CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chat_index_versions (
  id uuid PRIMARY KEY,
  embedding_model text NOT NULL,
  status text NOT NULL CHECK (status IN ('building', 'active', 'retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz
);

CREATE TABLE IF NOT EXISTS chat_chunks (
  id text PRIMARY KEY,
  version_id uuid NOT NULL REFERENCES chat_index_versions(id) ON DELETE CASCADE,
  source_id text NOT NULL,
  source_path text,
  title text NOT NULL,
  url text NOT NULL,
  section text,
  text text NOT NULL,
  content_hash text NOT NULL,
  embedding_model text NOT NULL,
  chunk_ordinal integer,
  source_offset integer,
  embedding vector NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id text NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  ordinal integer NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  refused boolean NOT NULL DEFAULT false,
  error boolean NOT NULL DEFAULT false,
  input_tokens integer,
  output_tokens integer,
  UNIQUE (conversation_id, ordinal)
);

CREATE TABLE IF NOT EXISTS chat_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id text REFERENCES chat_conversations(id) ON DELETE CASCADE,
  correlation_id text NOT NULL,
  latency_ms integer,
  provider_status text,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_rate_limits (
  key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count > 0)
);

CREATE INDEX IF NOT EXISTS chat_index_versions_active_idx ON chat_index_versions (status) WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS chat_index_versions_one_active_idx
  ON chat_index_versions (status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS chat_chunks_source_idx ON chat_chunks (source_id);
CREATE INDEX IF NOT EXISTS chat_chunks_similarity_idx ON chat_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS chat_conversations_retention_idx ON chat_conversations (expires_at);

CREATE OR REPLACE FUNCTION purge_expired_chat_data() RETURNS void LANGUAGE sql AS $$
  DELETE FROM chat_conversations WHERE expires_at <= now();
$$;

-- Schedule purge_expired_chat_data() with the managed Postgres provider's scheduler.
