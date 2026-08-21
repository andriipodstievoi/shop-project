-- Migration 003: product detail fields and customer reviews.
--
-- Run ONCE against an existing installation. A fresh install gets all of this
-- from schema.sql / schema-hosted.sql instead.
--
-- On shared hosting: phpMyAdmin -> select your database -> SQL tab -> paste.
-- Only adds columns and one table; no existing row is changed or removed.

-- --------------------------------------------------------- product details
-- Each on its own line: MySQL before 8.0 has no "ADD COLUMN IF NOT EXISTS",
-- and phpMyAdmin stops at the first error. A "Duplicate column name" on one
-- line is harmless — skip it and run the rest.
ALTER TABLE products ADD COLUMN sku VARCHAR(64) NOT NULL DEFAULT '' AFTER category;
ALTER TABLE products ADD COLUMN material VARCHAR(300) NOT NULL DEFAULT '' AFTER blurb;
ALTER TABLE products ADD COLUMN origin VARCHAR(120) NOT NULL DEFAULT '' AFTER material;
ALTER TABLE products ADD COLUMN weight VARCHAR(60) NOT NULL DEFAULT '' AFTER origin;
ALTER TABLE products ADD COLUMN care TEXT NULL AFTER weight;
-- Free-form extra rows for the specifications table, stored as a JSON array of
-- {label, value}. A column per characteristic would need a migration every
-- time the admin wants a new one.
ALTER TABLE products ADD COLUMN specs TEXT NULL AFTER care;

-- ----------------------------------------------------------------- reviews
CREATE TABLE IF NOT EXISTS reviews (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id  VARCHAR(64)  NOT NULL,
    -- Kept when the account goes, so the review does not vanish from a product
    user_id     INT UNSIGNED NULL,
    author_name VARCHAR(120) NOT NULL,
    rating      TINYINT UNSIGNED NOT NULL,
    body        TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_reviews_product (product_id, created_at),
    -- One review per account per product; MySQL permits repeated NULLs here,
    -- so reviews whose author was deleted do not collide
    UNIQUE KEY uniq_review_user_product (product_id, user_id),
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
