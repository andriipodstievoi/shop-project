-- Schema for shared hosting (InfinityFree and similar).
--
-- GENERATED FILE - do not edit by hand.
-- Produced from sql/schema.sql by: php sql/build-hosted.php
--
-- Unlike sql/schema.sql this file does NOT create or select a database: on
-- shared hosting you create it in the control panel, it gets a fixed name such
-- as if0_12345678_shop, and you import this file INTO it via phpMyAdmin.
-- Running CREATE DATABASE there would fail on permissions.

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

-- The catalog lives here rather than in products.json so the admin panel can
-- edit it. Writing the JSON file instead would lose every change the moment
-- the site is re-uploaded, and concurrent writes could truncate it.
CREATE TABLE IF NOT EXISTS products (
    id          VARCHAR(64)  NOT NULL,
    name        VARCHAR(200) NOT NULL,
    price       DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    category    VARCHAR(80)  NOT NULL DEFAULT '',
    sku         VARCHAR(64)  NOT NULL DEFAULT '',
    blurb       TEXT         NULL,
    material    VARCHAR(300) NOT NULL DEFAULT '',
    origin      VARCHAR(120) NOT NULL DEFAULT '',
    weight      VARCHAR(60)  NOT NULL DEFAULT '',
    care        TEXT         NULL,
    -- JSON array of {label, value} for characteristics the admin invents,
    -- so a new one does not need a schema change
    specs       TEXT         NULL,
    -- Optional external image; when empty the drawn SVG below is shown.
    -- Doubles as the thumbnail used on catalog cards.
    image_url   VARCHAR(1000) NOT NULL DEFAULT '',
    -- Gallery for the product page: JSON array of {type, url} where type is
    -- image, video or youtube
    media       TEXT         NULL,
    icon_color  VARCHAR(32)  NOT NULL DEFAULT '#555555',
    icon_bg     VARCHAR(200) NOT NULL DEFAULT '#eeeeee',
    icon_svg    TEXT         NULL,
    rating      DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
    reviews     INT UNSIGNED NOT NULL DEFAULT 0,
    stock       INT UNSIGNED NOT NULL DEFAULT 0,
    -- Products are retired, never deleted: order_items still refer to them
    active      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_products_active (active),
    KEY idx_products_category (category)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- One row per sign-in attempt, used to slow down password guessing.
CREATE TABLE IF NOT EXISTS login_attempts (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email        VARCHAR(255) NOT NULL,
    ip           VARCHAR(45)  NOT NULL DEFAULT '',
    successful   TINYINT(1)   NOT NULL DEFAULT 0,
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_attempts_email (email(191), attempted_at),
    KEY idx_attempts_ip (ip, attempted_at)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Messages sent through the contact form.
CREATE TABLE IF NOT EXISTS messages (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    -- Null when a signed-out visitor writes in
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
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Customer reviews. The rating shown on a product is averaged from these once
-- any exist, so the catalog stops relying on the seeded placeholder numbers.
CREATE TABLE IF NOT EXISTS reviews (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id  VARCHAR(64)  NOT NULL,
    user_id     INT UNSIGNED NULL,
    author_name VARCHAR(120) NOT NULL,
    rating      TINYINT UNSIGNED NOT NULL,
    body        TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_reviews_product (product_id, created_at),
    UNIQUE KEY uniq_review_user_product (product_id, user_id),
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL
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
    country       VARCHAR(100) NOT NULL DEFAULT '',
    city          VARCHAR(120) NOT NULL DEFAULT '',
    postal_code   VARCHAR(20)  NOT NULL DEFAULT '',
    -- Shipping choice, priced and dated on the server at checkout
    delivery_method VARCHAR(40)  NOT NULL DEFAULT '',
    shipping_cost   DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    eta_from      DATE NULL,
    eta_to        DATE NULL,
    -- DECIMAL, not FLOAT: money must not accumulate binary rounding error.
    -- Includes shipping_cost.
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
