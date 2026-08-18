<?php
// Regenerates sql/seed-products.sql and sql/repair-icons.sql from products.json.
//
//     php sql/build-seed.php
//
// This exists as a file rather than a one-liner on purpose. The first version
// of the seed was produced by `php -r '...'` with "\x27" written inside a
// single-quoted PHP string, so the escape was never interpreted: the literal
// characters \x27 went into the SQL, MySQL dropped the backslash, and every
// drawn illustration ended up as fill=x27currentColorx27. Quoting is done by
// PDO::quote here so it cannot be got wrong by hand.
declare(strict_types=1);

$dir = __DIR__;
$products = json_decode(file_get_contents($dir . '/../products.json'), true);

if (!is_array($products)) {
    fwrite(STDERR, "Cannot read products.json\n");
    exit(1);
}

// A throwaway sqlite handle purely for its quoting, so no server is needed
$quoter = new PDO('sqlite::memory:');
$q = static fn (string $v): string => $quoter->quote($v);

/* ---------------------------------------------------------------- seed */

$seed = <<<TXT
-- Seed the products table from products.json.
--
-- GENERATED FILE - do not edit by hand. Produced by: php sql/build-seed.php
--
-- Safe to run more than once: INSERT IGNORE skips ids already present, so it
-- never overwrites a product edited in the admin panel.


TXT;

foreach ($products as $p) {
    $seed .= "INSERT IGNORE INTO products\n";
    $seed .= "  (id, name, price, category, blurb, icon_color, icon_bg, icon_svg, rating, reviews, stock, active)\n";
    $seed .= "VALUES (\n";
    $seed .= '  ' . $q((string) $p['id']) . ",\n";
    $seed .= '  ' . $q((string) $p['name']) . ",\n";
    $seed .= '  ' . number_format((float) $p['price'], 2, '.', '') . ",\n";
    $seed .= '  ' . $q((string) $p['category']) . ",\n";
    $seed .= '  ' . $q((string) $p['blurb']) . ",\n";
    $seed .= '  ' . $q((string) $p['icon']['color']) . ",\n";
    $seed .= '  ' . $q((string) $p['icon']['bg']) . ",\n";
    $seed .= '  ' . $q((string) $p['icon']['svg']) . ",\n";
    $seed .= '  ' . (float) $p['rating'] . ",\n";
    $seed .= '  ' . (int) $p['reviews'] . ",\n";
    $seed .= "  25,\n";
    $seed .= "  1\n";
    $seed .= ");\n\n";
}

file_put_contents($dir . '/seed-products.sql', $seed);

/* -------------------------------------------------------------- repair */

$repair = <<<TXT
-- Repairs the drawn illustrations on an installation seeded before the
-- generator was fixed.
--
-- GENERATED FILE - do not edit by hand. Produced by: php sql/build-seed.php
--
-- Symptom: icon_svg reads fill=x27currentColorx27 instead of
-- fill='currentColor', because the earlier seed wrote a literal \\x27 where an
-- apostrophe belonged, and every illustration renders as nothing.
--
-- Only the three icon columns are touched. Names, prices, stock, descriptions
-- and anything else edited in the admin panel are left exactly as they are.


TXT;

foreach ($products as $p) {
    $repair .= "UPDATE products SET\n";
    $repair .= '  icon_color = ' . $q((string) $p['icon']['color']) . ",\n";
    $repair .= '  icon_bg    = ' . $q((string) $p['icon']['bg']) . ",\n";
    $repair .= '  icon_svg   = ' . $q((string) $p['icon']['svg']) . "\n";
    $repair .= 'WHERE id = ' . $q((string) $p['id']) . ";\n\n";
}

file_put_contents($dir . '/repair-icons.sql', $repair);

echo 'wrote seed-products.sql and repair-icons.sql for ' . count($products) . " products\n";
