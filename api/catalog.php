<?php
// The catalog lives in the products table so the admin panel can edit it.
// products.json remains only as the one-time seed (sql/seed-products.sql).
declare(strict_types=1);
require_once __DIR__ . '/db.php';

// specs is stored as a JSON array of {label, value}; anything malformed is
// treated as "no extra characteristics" rather than breaking the page.
function decode_specs(?string $raw): array
{
    if ($raw === null || trim($raw) === '') {
        return [];
    }
    $parsed = json_decode($raw, true);
    if (!is_array($parsed)) {
        return [];
    }

    $rows = [];
    foreach ($parsed as $row) {
        if (!is_array($row)) {
            continue;
        }
        $label = trim((string) ($row['label'] ?? ''));
        $value = trim((string) ($row['value'] ?? ''));
        if ($label !== '' && $value !== '') {
            $rows[] = ['label' => $label, 'value' => $value];
        }
    }
    return $rows;
}

function product_row_to_array(array $row): array
{
    // Real reviews win over the seeded placeholder numbers once they exist
    $reviewCount = (int) ($row['review_count'] ?? 0);
    $reviewAvg = $row['review_avg'] === null ? null : (float) $row['review_avg'];

    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'price' => (float) $row['price'],
        'category' => $row['category'],
        'sku' => (string) ($row['sku'] ?? ''),
        'blurb' => (string) $row['blurb'],
        'material' => (string) ($row['material'] ?? ''),
        'origin' => (string) ($row['origin'] ?? ''),
        'weight' => (string) ($row['weight'] ?? ''),
        'care' => (string) ($row['care'] ?? ''),
        'specs' => decode_specs($row['specs'] ?? null),
        'image_url' => (string) $row['image_url'],
        'rating' => $reviewCount > 0 ? round((float) $reviewAvg, 1) : (float) $row['rating'],
        'reviews' => $reviewCount > 0 ? $reviewCount : (int) $row['reviews'],
        'has_real_reviews' => $reviewCount > 0,
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
        $sql = 'SELECT p.*,
                       (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS review_count,
                       (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id) AS review_avg
                FROM products p';
        if (!$includeInactive) {
            $sql .= ' WHERE p.active = 1';
        }
        $sql .= ' ORDER BY p.created_at, p.id';

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
