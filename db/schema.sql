-- Roamlog database structure for PostgreSQL / pgAdmin 4.
-- Run this script in the target PostgreSQL database when the server is ready
-- to move from the temporary in-memory data layer to real persistence.

CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE locations (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    country     TEXT NOT NULL,
    date_from   DATE NOT NULL,
    date_to     DATE NOT NULL,
    description TEXT NOT NULL,
    theme       TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT locations_valid_date_range CHECK (date_to >= date_from)
);

CREATE INDEX locations_user_id_idx ON locations(user_id);

-- Planned query examples for server.js:
--
-- INSERT INTO users (name, email, password_hash)
-- VALUES ($1, $2, $3)
-- RETURNING id, name, email, created_at;
--
-- SELECT id, name, email, password_hash
-- FROM users
-- WHERE email = $1;
--
-- SELECT id, user_id, title, country, date_from, date_to, description, theme
-- FROM locations
-- WHERE user_id = $1
-- ORDER BY date_from DESC;
--
-- INSERT INTO locations
-- (user_id, title, country, date_from, date_to, description, theme)
-- VALUES ($1, $2, $3, $4, $5, $6, $7)
-- RETURNING *;
