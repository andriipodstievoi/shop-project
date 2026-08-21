<?php
// Public catalog feed for the storefront. Replaces the direct fetch of
// products.json now that the catalog lives in the database.
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/catalog.php';
require_once __DIR__ . '/shipping.php';

require_method('GET');

// array_values: the browser wants a list, not an object keyed by id
json_out([
    'products' => array_values(catalog()),
    'shipping' => shipping_methods(),
]);
