-- Database schema for the shop backend.
-- Import once:  mysql -u root < sql/schema.sql
-- or paste into phpMyAdmin (XAMPP -> http://localhost/phpmyadmin).

CREATE DATABASE IF NOT EXISTS shop_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE shop_db;

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
    UNIQUE KEY uniq_users_email (email)
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
