-- Schema for shared hosting (InfinityFree and similar).
--
-- Unlike sql/schema.sql this file does NOT create or select a database:
-- on shared hosting you create it in the control panel, it gets a fixed
-- name such as if0_12345678_shop, and you import this file INTO it via
-- phpMyAdmin. Running CREATE DATABASE there would fail on permissions.


CREATE TABLE IF NOT EXISTS users (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email          VARCHAR(255) NOT NULL,
    -- Always a hash produced by password_hash(); never a readable password.
    password_hash  VARCHAR(255) NOT NULL,
    name           VARCHAR(120) NOT NULL DEFAULT '',
    phone          VARCHAR(40)  NOT NULL DEFAULT '',
    -- 'admin' unlocks the admin panel; granted manually in the database.
    role           ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- Indexed on the first 191 characters: utf8mb4 stores 4 bytes per
    -- character, and older InnoDB caps an index at 767 bytes, so a full
    -- VARCHAR(255) index (1020 bytes) fails to import on some shared hosts.
    UNIQUE KEY uniq_users_email (email(191))
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Cart and wishlist rows belong to an account. product_id references an entry
-- in products.json, which the API validates before writing, so a client cannot
-- store an item that does not exist.
CREATE TABLE IF NOT EXISTS cart_items (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    product_id VARCHAR(64)  NOT NULL,
    qty        INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- One row per product per user, so quantity changes are an update
    UNIQUE KEY uniq_cart_user_product (user_id, product_id),
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlist_items (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    product_id VARCHAR(64)  NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_wishlist_user_product (user_id, product_id),
    CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Orders keep their own copy of the contact details, so the shop still knows
-- where an order was going even if the account is later removed.
CREATE TABLE IF NOT EXISTS orders (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    -- Nullable: deleting an account must not erase the shop's order history
    user_id       INT UNSIGNED NULL,
    contact_name  VARCHAR(120) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(40)  NOT NULL DEFAULT '',
    address       VARCHAR(500) NOT NULL,
    -- DECIMAL, not FLOAT: money must not accumulate binary rounding error
    total         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status        ENUM('new', 'processing', 'shipped', 'completed', 'cancelled')
                  NOT NULL DEFAULT 'new',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_orders_user (user_id),
    KEY idx_orders_status (status),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Name and price are copied in at checkout. A later price change in
-- products.json must never rewrite what a customer already paid.
CREATE TABLE IF NOT EXISTS order_items (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id     INT UNSIGNED NOT NULL,
    product_id   VARCHAR(64)  NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    unit_price   DECIMAL(10, 2) NOT NULL,
    qty          INT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY idx_order_items_order (order_id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
