-- Migration 002: catalog in the database, richer delivery, contact messages,
-- login throttling.
--
-- Run this ONCE against an existing installation that already has data.
-- A fresh install should use schema.sql / schema-hosted.sql instead, which
-- already contain everything below.
--
-- On shared hosting: phpMyAdmin -> select your database -> SQL tab -> paste.
--
-- Safe to run on a live database: it only adds tables and columns, and never
-- drops or rewrites existing rows.

-- ---------------------------------------------------------------- products
CREATE TABLE IF NOT EXISTS products (
    id          VARCHAR(64)  NOT NULL,
    name        VARCHAR(200) NOT NULL,
    price       DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    category    VARCHAR(80)  NOT NULL DEFAULT '',
    blurb       TEXT         NULL,
    image_url   VARCHAR(1000) NOT NULL DEFAULT '',
    icon_color  VARCHAR(32)  NOT NULL DEFAULT '#555555',
    icon_bg     VARCHAR(200) NOT NULL DEFAULT '#eeeeee',
    icon_svg    TEXT         NULL,
    rating      DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
    reviews     INT UNSIGNED NOT NULL DEFAULT 0,
    stock       INT UNSIGNED NOT NULL DEFAULT 0,
    active      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_products_active (active),
    KEY idx_products_category (category)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------- login_attempts
CREATE TABLE IF NOT EXISTS login_attempts (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email        VARCHAR(255) NOT NULL,
    ip           VARCHAR(45)  NOT NULL DEFAULT '',
    successful   TINYINT(1)   NOT NULL DEFAULT 0,
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_attempts_email (email(191), attempted_at),
    KEY idx_attempts_ip (ip, attempted_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- messages
CREATE TABLE IF NOT EXISTS messages (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NULL,
    name       VARCHAR(120) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    subject    VARCHAR(200) NOT NULL DEFAULT '',
    body       TEXT NOT NULL,
    status     ENUM('new', 'read', 'resolved') NOT NULL DEFAULT 'new',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_messages_status (status),
    CONSTRAINT fk_messages_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ------------------------------------------------------------ orders extra
-- MySQL has no "ADD COLUMN IF NOT EXISTS" before 8.0, and phpMyAdmin stops on
-- the first error, so each column is added on its own line. If a column
-- already exists you will see "Duplicate column name" for that line only —
-- that is harmless, skip it and run the rest.
ALTER TABLE orders ADD COLUMN country VARCHAR(100) NOT NULL DEFAULT '' AFTER address;
ALTER TABLE orders ADD COLUMN city VARCHAR(120) NOT NULL DEFAULT '' AFTER country;
ALTER TABLE orders ADD COLUMN postal_code VARCHAR(20) NOT NULL DEFAULT '' AFTER city;
ALTER TABLE orders ADD COLUMN delivery_method VARCHAR(40) NOT NULL DEFAULT '' AFTER postal_code;
ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER delivery_method;
ALTER TABLE orders ADD COLUMN eta_from DATE NULL AFTER shipping_cost;
ALTER TABLE orders ADD COLUMN eta_to DATE NULL AFTER eta_from;
