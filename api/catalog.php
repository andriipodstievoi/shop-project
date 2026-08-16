<?php
// The catalog now lives in the products table so the admin panel can edit it.
// products.json remains only as the one-time seed (sql/seed-products.sql).
declare(strict_types=1);
require_once __DIR__ . '/db.php';

function product_row_to_array(array $row): array
{
    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'price' => (float) $row['price'],
        'category' => $row['category'],
        'blurb' => (string) $row['blurb'],
        'image_url' => (string) $row['image_url'],
        'rating' => (float) $row['rating'],
        'reviews' => (int) $row['reviews'],
        'stock' => (int) $row['stock'],
        'active' => (int) $row['active'] === 1,
        'icon' => [
            'color' => $row['icon_color'],
            'bg' => $row['icon_bg'],
            'svg' => (string) $row['icon_svg'],
        ],
    ];
}

// Keyed by id. $includeInactive is for the admin panel, which must still see
// retired products; the storefront only ever gets active ones.
function catalog(bool $includeInactive = false): array
{
    static $cache = [];
    $key = $includeInactive ? 'all' : 'active';

    if (!isset($cache[$key])) {
        $sql = 'SELECT * FROM products';
        if (!$includeInactive) {
            $sql .= ' WHERE active = 1';
        }
        $sql .= ' ORDER BY created_at, id';

        $rows = db()->query($sql)->fetchAll();
        $byId = [];
        foreach ($rows as $row) {
            $byId[$row['id']] = product_row_to_array($row);
        }
        $cache[$key] = $byId;
    }

    return $cache[$key];
}

function product_exists(string $id): bool
{
    return isset(catalog()[$id]);
}

function product_price(string $id): float
{
    return (float) (catalog()[$id]['price'] ?? 0.0);
}

function product_stock(string $id): int
{
    return (int) (catalog()[$id]['stock'] ?? 0);
}
