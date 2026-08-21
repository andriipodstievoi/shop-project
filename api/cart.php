<?php
// GET  -> the signed-in user's cart
// POST -> {action: add|set|remove|clear|merge, ...}
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/catalog.php';

const MAX_QTY = 99;

function cart_rows(int $userId): array
{
    $stmt = db()->prepare(
        'SELECT product_id, qty FROM cart_items WHERE user_id = ? ORDER BY created_at'
    );
    $stmt->execute([$userId]);

    $items = [];
    $total = 0.0;
    foreach ($stmt->fetchAll() as $row) {
        // A product removed from the catalog is skipped rather than shown broken
        if (!product_exists($row['product_id'])) {
            continue;
        }
        $qty = (int) $row['qty'];
        $items[] = ['id' => $row['product_id'], 'qty' => $qty];
        // The total is computed from catalog prices, never from the client
        $total += product_price($row['product_id']) * $qty;
    }

    return ['items' => $items, 'total' => round($total, 2)];
}

$user = require_login();
$userId = (int) $user['id'];

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    json_out(cart_rows($userId));
}

require_method('POST');
require_csrf();

$body = read_json_body();
$action = (string) ($body['action'] ?? '');
$productId = (string) ($body['product_id'] ?? '');

if (in_array($action, ['add', 'set', 'remove'], true) && !product_exists($productId)) {
    json_error('Unknown product');
}

switch ($action) {
    case 'add':
        $stmt = db()->prepare(
            'INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE qty = LEAST(qty + 1, ' . MAX_QTY . ')'
        );
        $stmt->execute([$userId, $productId]);
        break;

    case 'set':
        $qty = (int) ($body['qty'] ?? 0);
        if ($qty <= 0) {
            $stmt = db()->prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?');
            $stmt->execute([$userId, $productId]);
        } else {
            $qty = min($qty, MAX_QTY);
            $stmt = db()->prepare(
                'INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE qty = VALUES(qty)'
            );
            $stmt->execute([$userId, $productId, $qty]);
        }
        break;

    case 'remove':
        $stmt = db()->prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?');
        $stmt->execute([$userId, $productId]);
        break;

    case 'clear':
        $stmt = db()->prepare('DELETE FROM cart_items WHERE user_id = ?');
        $stmt->execute([$userId]);
        break;

    // Folds a signed-out browser cart into the account on sign-in
    case 'merge':
        $items = is_array($body['items'] ?? null) ? $body['items'] : [];
        $stmt = db()->prepare(
            'INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE qty = LEAST(qty + VALUES(qty), ' . MAX_QTY . ')'
        );
        foreach ($items as $item) {
            $id = (string) ($item['id'] ?? '');
            $qty = (int) ($item['qty'] ?? 0);
            if ($qty > 0 && product_exists($id)) {
                $stmt->execute([$userId, $id, min($qty, MAX_QTY)]);
            }
        }
        break;

    default:
        json_error('Unknown action');
}

json_out(cart_rows($userId));
