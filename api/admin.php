<?php
// Admin-only.
//   GET  ?resource=summary|users|orders|products|messages
//   POST {action: set_status | save_product | set_product_active | set_message_status}
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/catalog.php';
require_once __DIR__ . '/orders_lib.php';

// Every path below runs only for an account whose role is 'admin' in the
// database. The hidden link on account.html is convenience, not security.
$admin = require_admin();

const ALLOWED_STATUSES = ['new', 'processing', 'shipped', 'completed', 'cancelled'];
const ALLOWED_MESSAGE_STATUSES = ['new', 'read', 'resolved'];

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $resource = (string) ($_GET['resource'] ?? 'summary');

    if ($resource === 'summary') {
        $users = (int) db()->query('SELECT COUNT(*) FROM users')->fetchColumn();
        $orderCount = (int) db()->query('SELECT COUNT(*) FROM orders')->fetchColumn();
        $revenue = (float) db()->query(
            "SELECT COALESCE(SUM(total), 0) FROM orders WHERE status <> 'cancelled'"
        )->fetchColumn();
        $pending = (int) db()->query(
            "SELECT COUNT(*) FROM orders WHERE status IN ('new', 'processing')"
        )->fetchColumn();
        $unread = (int) db()->query(
            "SELECT COUNT(*) FROM messages WHERE status = 'new'"
        )->fetchColumn();
        $outOfStock = (int) db()->query(
            'SELECT COUNT(*) FROM products WHERE active = 1 AND stock = 0'
        )->fetchColumn();

        json_out([
            'users' => $users,
            'orders' => $orderCount,
            'revenue' => round($revenue, 2),
            'pending' => $pending,
            'unread' => $unread,
            'out_of_stock' => $outOfStock,
        ]);
    }

    if ($resource === 'users') {
        // password_hash is never selected, not even for an admin
        $rows = db()->query(
            'SELECT u.id, u.email, u.name, u.phone, u.role, u.created_at,
                    (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
             FROM users u
             ORDER BY u.created_at DESC'
        )->fetchAll();

        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['order_count'] = (int) $row['order_count'];
        }
        unset($row);

        json_out(['users' => $rows]);
    }

    if ($resource === 'orders') {
        // null user id = every order, not just the admin's own
        json_out(['orders' => orders_for(null)]);
    }

    if ($resource === 'products') {
        // Retired products included, so they can be brought back
        json_out(['products' => array_values(catalog(true))]);
    }

    if ($resource === 'messages') {
        $rows = db()->query(
            'SELECT id, user_id, name, email, subject, body, status, created_at
             FROM messages ORDER BY created_at DESC'
        )->fetchAll();

        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['user_id'] = $row['user_id'] === null ? null : (int) $row['user_id'];
        }
        unset($row);

        json_out(['messages' => $rows]);
    }

    json_error('Unknown resource');
}

require_method('POST');
require_csrf();

$body = read_json_body();
$action = (string) ($body['action'] ?? '');

/* ------------------------------------------------------------ order status */

if ($action === 'set_status') {
    $orderId = (int) ($body['order_id'] ?? 0);
    $status = (string) ($body['status'] ?? '');

    if ($orderId <= 0) {
        json_error('Invalid order');
    }
    if (!in_array($status, ALLOWED_STATUSES, true)) {
        json_error('Invalid status');
    }

    $stmt = db()->prepare('UPDATE orders SET status = ? WHERE id = ?');
    $stmt->execute([$status, $orderId]);

    if ($stmt->rowCount() === 0) {
        $exists = db()->prepare('SELECT 1 FROM orders WHERE id = ?');
        $exists->execute([$orderId]);
        if (!$exists->fetchColumn()) {
            json_error('Order not found', 404);
        }
    }

    json_out(['ok' => true, 'order_id' => $orderId, 'status' => $status]);
}

/* ---------------------------------------------------------------- products */

if ($action === 'save_product') {
    $id = trim((string) ($body['id'] ?? ''));
    $name = trim((string) ($body['name'] ?? ''));
    $category = trim((string) ($body['category'] ?? ''));
    $blurb = trim((string) ($body['blurb'] ?? ''));
    $imageUrl = trim((string) ($body['image_url'] ?? ''));
    $price = (float) ($body['price'] ?? 0);
    $stock = (int) ($body['stock'] ?? 0);
    $isNew = (bool) ($body['is_new'] ?? false);

    $sku = trim((string) ($body['sku'] ?? ''));
    $material = trim((string) ($body['material'] ?? ''));
    $origin = trim((string) ($body['origin'] ?? ''));
    $weight = trim((string) ($body['weight'] ?? ''));
    $care = trim((string) ($body['care'] ?? ''));

    if (mb_strlen($sku) > 64) {
        json_error('SKU is too long');
    }
    if (mb_strlen($material) > 300) {
        json_error('Material is too long');
    }
    if (mb_strlen($origin) > 120) {
        json_error('Origin is too long');
    }
    if (mb_strlen($weight) > 60) {
        json_error('Weight is too long');
    }
    if (mb_strlen($care) > 2000) {
        json_error('Care instructions are too long');
    }

    // The admin types free-form characteristics as "Label: Value" lines; they
    // are normalised here and stored as JSON, so the page never has to parse
    // whatever was typed.
    $specsRows = [];
    $specsRaw = (string) ($body['specs'] ?? '');
    if (mb_strlen($specsRaw) > 4000) {
        json_error('Specifications are too long');
    }
    foreach (preg_split('~\r?\n~', $specsRaw) as $line) {
        $line = trim($line);
        if ($line === '') {
            continue;
        }
        $parts = explode(':', $line, 2);
        if (count($parts) !== 2) {
            json_error('Each specification line must look like "Label: Value" — check: ' . $line);
        }
        $label = trim($parts[0]);
        $value = trim($parts[1]);
        if ($label === '' || $value === '') {
            json_error('Each specification line must look like "Label: Value" — check: ' . $line);
        }
        if (count($specsRows) >= 30) {
            json_error('Up to 30 specification lines');
        }
        $specsRows[] = ['label' => $label, 'value' => $value];
    }
    $specsJson = $specsRows ? json_encode($specsRows, JSON_UNESCAPED_UNICODE) : null;

    if ($name === '' || mb_strlen($name) > 200) {
        json_error('Product name is required');
    }
    if ($price < 0 || $price > 999999) {
        json_error('Price must be between 0 and 999999');
    }
    if ($stock < 0 || $stock > 1000000) {
        json_error('Stock must be zero or more');
    }
    if (mb_strlen($category) > 80) {
        json_error('Category is too long');
    }
    if (mb_strlen($imageUrl) > 1000) {
        json_error('Image URL is too long');
    }
    // Only plain web images: a javascript: or data: URL here would end up in
    // an <img src> on every visitor's page.
    if ($imageUrl !== '' && !preg_match('~^https?://~i', $imageUrl)) {
        json_error('Image URL must start with http:// or https://');
    }

    if ($isNew) {
        // Slug from the name, so ids stay readable in URLs
        if ($id === '') {
            $id = strtolower((string) preg_replace('~[^a-z0-9]+~i', '-', $name));
            $id = trim($id, '-');
        }
        if ($id === '' || !preg_match('~^[a-z0-9][a-z0-9-]{0,63}$~', $id)) {
            json_error('Could not build a valid id from that name; please set one manually');
        }

        $exists = db()->prepare('SELECT 1 FROM products WHERE id = ?');
        $exists->execute([$id]);
        if ($exists->fetchColumn()) {
            json_error('A product with this id already exists', 409);
        }

        $stmt = db()->prepare(
            'INSERT INTO products
                (id, name, price, category, sku, blurb, material, origin, weight,
                 care, specs, image_url, stock, active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)'
        );
        $stmt->execute([
            $id,
            $name,
            number_format($price, 2, '.', ''),
            $category,
            $sku,
            $blurb,
            $material,
            $origin,
            $weight,
            $care,
            $specsJson,
            $imageUrl,
            $stock,
        ]);

        json_out(['ok' => true, 'id' => $id], 201);
    }

    $exists = db()->prepare('SELECT 1 FROM products WHERE id = ?');
    $exists->execute([$id]);
    if (!$exists->fetchColumn()) {
        json_error('Product not found', 404);
    }

    $stmt = db()->prepare(
        'UPDATE products
            SET name = ?, price = ?, category = ?, sku = ?, blurb = ?,
                material = ?, origin = ?, weight = ?, care = ?, specs = ?,
                image_url = ?, stock = ?
          WHERE id = ?'
    );
    $stmt->execute([
        $name,
        number_format($price, 2, '.', ''),
        $category,
        $sku,
        $blurb,
        $material,
        $origin,
        $weight,
        $care,
        $specsJson,
        $imageUrl,
        $stock,
        $id,
    ]);

    json_out(['ok' => true, 'id' => $id]);
}

if ($action === 'set_product_active') {
    $id = trim((string) ($body['id'] ?? ''));
    $active = !empty($body['active']) ? 1 : 0;

    // Retire rather than delete: order_items still point at this product, and
    // past orders must keep showing what was bought.
    $stmt = db()->prepare('UPDATE products SET active = ? WHERE id = ?');
    $stmt->execute([$active, $id]);

    if ($stmt->rowCount() === 0) {
        $exists = db()->prepare('SELECT 1 FROM products WHERE id = ?');
        $exists->execute([$id]);
        if (!$exists->fetchColumn()) {
            json_error('Product not found', 404);
        }
    }

    json_out(['ok' => true, 'id' => $id, 'active' => (bool) $active]);
}

/* ---------------------------------------------------------------- messages */

if ($action === 'set_message_status') {
    $messageId = (int) ($body['message_id'] ?? 0);
    $status = (string) ($body['status'] ?? '');

    if ($messageId <= 0) {
        json_error('Invalid message');
    }
    if (!in_array($status, ALLOWED_MESSAGE_STATUSES, true)) {
        json_error('Invalid status');
    }

    $stmt = db()->prepare('UPDATE messages SET status = ? WHERE id = ?');
    $stmt->execute([$status, $messageId]);

    json_out(['ok' => true, 'message_id' => $messageId, 'status' => $status]);
}

json_error('Unknown action');
