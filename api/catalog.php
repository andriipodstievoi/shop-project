<?php
// Reads products.json, the single source of truth shared with the browser.
// Used to validate ids before writing them, and to price items server-side.
declare(strict_types=1);

function catalog(): array
{
    static $byId = null;

    if ($byId === null) {
        $path = __DIR__ . '/../products.json';
        $raw = is_file($path) ? file_get_contents($path) : false;
        $list = $raw === false ? null : json_decode($raw, true);

        if (!is_array($list)) {
            error_log('Catalog missing or invalid: ' . $path);
            return [];
        }

        $byId = [];
        foreach ($list as $product) {
            if (isset($product['id'])) {
                $byId[(string) $product['id']] = $product;
            }
        }
    }

    return $byId;
}

function product_exists(string $id): bool
{
    return isset(catalog()[$id]);
}

function product_price(string $id): float
{
    return (float) (catalog()[$id]['price'] ?? 0.0);
}
