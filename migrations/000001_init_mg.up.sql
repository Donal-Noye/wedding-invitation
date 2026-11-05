CREATE TABLE rsvps
(
    id         BIGSERIAL PRIMARY KEY,
    slug       TEXT        NOT NULL,
    name       TEXT        NOT NULL,
    guests     INT         NOT NULL,
    attending  BOOLEAN     NOT NULL,
    fish       TEXT        NOT NULL DEFAULT '',
    meat       TEXT        NOT NULL DEFAULT '',
    alcohol    TEXT        NOT NULL DEFAULT '',
    allergies  TEXT        NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX rsvps_slug_idx ON rsvps (slug);