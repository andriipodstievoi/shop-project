<?php
// GET  -> the signed-in user's wishlist (array of product ids)
// POST -> {action: add|remove|toggle|merge, ...}
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/catalog.php';

function wishlist_ids(int $userId): array
{
    $stmt = db()->prepare(
        'SELECT product_id FROM wishlist_items WHERE user_id = ? ORDER BY created_at'
    );
    $stmt->execute([$userId]);

    $ids = [];
    foreach ($stmt->fetchAll() as $row) {
        if (product_exists($row['product_id'])) {
            $ids[] = $row['product_id'];
        }
    }
    return $ids;
}

$user = require_login();
$userId = (int) $user['id'];

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    json_out(['items' => wishlist_ids($userId)]);
}

require_method('POST');
require_csrf();

$body = read_json_body();
$action = (string) ($body['action'] ?? '');
$productId = (string) ($body['product_id'] ?? '');

if (in_array($action, ['add', 'remove', 'toggle'], true) && !product_exists($productId)) {
    json_error('Unknown product');
}

// INSERT IGNORE keeps the unique index from erroring on a duplicate add
$insert = db()->prepare('INSERT IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)');
$delete = db()->prepare('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?');

switch ($action) {
    case 'add':
        $insert->execute([$userId, $productId]);
        break;

    case 'remove':
        $delete->execute([$userId, $productId]);
        break;

    case 'toggle':
        $check = db()->prepare('SELECT 1 FROM wishlist_items WHERE user_id = ? AND product_id = ?');
        $check->execute([$userId, $productId]);
        if ($check->fetchColumn()) {
            $delete->execute([$userId, $productId]);
        } else {
            $insert->execute([$userId, $productId]);
        }
        break;

    case 'merge':
        $items = is_array($body['items'] ?? null) ? $body['items'] : [];
        foreach ($items as $id) {
            $id = (string) $id;
            if (product_exists($id)) {
                $insert->execute([$userId, $id]);
            }
        }
        break;

    default:
        json_error('Unknown action');
}

json_out(['items' => wishlist_ids($userId)]);
