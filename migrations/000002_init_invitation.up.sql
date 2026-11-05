CREATE TABLE invitations
(
    slug       TEXT        PRIMARY KEY CHECK (char_length(slug) <= 64),
    data       JSONB       NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);