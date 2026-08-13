<?php
// GET  -> the signed-in user's own orders
// POST -> {action: 'create', contact_name, contact_phone, address}
//         turns the current cart into an order
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/catalog.php';
require_once __DIR__ . '/orders_lib.php';

$user = require_login();
$userId = (int) $user['id'];

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    json_out(['orders' => orders_for($userId)]);
}

require_method('POST');
require_csrf();

$body = read_json_body();
if (($body['action'] ?? '') !== 'create') {
    json_error('Unknown action');
}

$name = trim((string) ($body['contact_name'] ?? ''));
$phone = trim((string) ($body['contact_phone'] ?? ''));
$address = trim((string) ($body['address'] ?? ''));

if ($name === '' || mb_strlen($name) > 120) {
    json_error('Please enter a delivery name');
}
if ($address === '' || mb_strlen($address) > 500) {
    json_error('Please enter a delivery address');
}
if (mb_strlen($phone) > 40) {
    json_error('Phone number is too long');
}

$pdo = db();

// The cart, order and items must all succeed or all roll back, otherwise a
// failure halfway could charge for an order with missing lines or leave the
// cart already emptied.
$pdo->beginTransaction();

try {
    $cartStmt = $pdo->prepare('SELECT product_id, qty FROM cart_items WHERE user_id = ? FOR UPDATE');
    $cartStmt->execute([$userId]);
    $cart = $cartStmt->fetchAll();

    $lines = [];
    $total = 0.0;
    foreach ($cart as $row) {
        if (!product_exists($row['product_id'])) {
            continue;
        }
        $qty = (int) $row['qty'];
        if ($qty < 1) {
            continue;
        }
        $product = catalog()[$row['product_id']];
        $price = (float) $product['price'];
        $total += $price * $qty;
        $lines[] = [
            'id' => $row['product_id'],
            'name' => (string) $product['name'],
            'price' => $price,
            'qty' => $qty,
        ];
    }

    if (!$lines) {
        $pdo->rollBack();
        json_error('Your cart is empty');
    }

    $insertOrder = $pdo->prepare(
        'INSERT INTO orders (user_id, contact_name, contact_email, contact_phone, address, total)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $insertOrder->execute([
        $userId,
        $name,
        $user['email'],
        $phone,
        $address,
        number_format($total, 2, '.', ''),
    ]);

    $orderId = (int) $pdo->lastInsertId();

    $insertItem = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, unit_price, qty)
         VALUES (?, ?, ?, ?, ?)'
    );
    foreach ($lines as $line) {
        $insertItem->execute([
            $orderId,
            $line['id'],
            $line['name'],
            number_format($line['price'], 2, '.', ''),
            $line['qty'],
        ]);
    }

    // The cart is consumed by the order
    $clear = $pdo->prepare('DELETE FROM cart_items WHERE user_id = ?');
    $clear->execute([$userId]);

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Order creation failed: ' . $e->getMessage());
    json_error('Could not place the order', 500);
}

$orders = orders_for($userId, $orderId);
json_out(['order' => $orders[0] ?? null], 201);
