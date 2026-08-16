<?php
// GET  -> the signed-in user's own orders
// POST -> {action: 'create', ...delivery details} turns the cart into an order
//         {action: 'cancel', order_id} cancels an order still marked 'new'
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/catalog.php';
require_once __DIR__ . '/shipping.php';
require_once __DIR__ . '/orders_lib.php';

$user = require_login();
$userId = (int) $user['id'];

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    json_out(['orders' => orders_for($userId)]);
}

require_method('POST');
require_csrf();

$body = read_json_body();
$action = (string) ($body['action'] ?? '');

/* ---------------------------------------------------------- cancel order */

if ($action === 'cancel') {
    $orderId = (int) ($body['order_id'] ?? 0);
    if ($orderId <= 0) {
        json_error('Invalid order');
    }

    // Scoped to this user and to the 'new' status, so a customer can neither
    // cancel someone else's order nor one that is already on its way.
    $stmt = db()->prepare(
        "UPDATE orders SET status = 'cancelled'
         WHERE id = ? AND user_id = ? AND status = 'new'"
    );
    $stmt->execute([$orderId, $userId]);

    if ($stmt->rowCount() === 0) {
        json_error('This order can no longer be cancelled', 409);
    }

    json_out(['orders' => orders_for($userId)]);
}

if ($action !== 'create') {
    json_error('Unknown action');
}

/* ---------------------------------------------------------- create order */

$name = trim((string) ($body['contact_name'] ?? ''));
$phone = trim((string) ($body['contact_phone'] ?? ''));
$address = trim((string) ($body['address'] ?? ''));
$country = trim((string) ($body['country'] ?? ''));
$city = trim((string) ($body['city'] ?? ''));
$postal = trim((string) ($body['postal_code'] ?? ''));
$methodKey = trim((string) ($body['delivery_method'] ?? ''));

if ($name === '' || mb_strlen($name) > 120) {
    json_error('Please enter a delivery name');
}
if (!is_shipping_country($country)) {
    json_error('Please choose a country we ship to');
}
if ($city === '' || mb_strlen($city) > 120) {
    json_error('Please enter a city');
}
if (mb_strlen($postal) > 20) {
    json_error('Postal code is too long');
}
if ($address === '' || mb_strlen($address) > 500) {
    json_error('Please enter a street address');
}
if (mb_strlen($phone) > 40) {
    json_error('Phone number is too long');
}

// The client sends only the method key; cost and dates come from the server.
$method = shipping_method($methodKey);
if ($method === null) {
    json_error('Please choose a delivery method');
}
$eta = estimate_window($method);

$pdo = db();

// Cart, stock, order and items must all succeed or all roll back.
$pdo->beginTransaction();

try {
    $cartStmt = $pdo->prepare('SELECT product_id, qty FROM cart_items WHERE user_id = ? FOR UPDATE');
    $cartStmt->execute([$userId]);
    $cart = $cartStmt->fetchAll();

    // Locked so two simultaneous checkouts cannot both pass the stock check
    $productStmt = $pdo->prepare('SELECT id, name, price, stock FROM products WHERE id = ? AND active = 1 FOR UPDATE');

    $lines = [];
    $itemsTotal = 0.0;

    foreach ($cart as $row) {
        $qty = (int) $row['qty'];
        if ($qty < 1) {
            continue;
        }

        $productStmt->execute([$row['product_id']]);
        $product = $productStmt->fetch();
        if (!$product) {
            continue;
        }

        if ((int) $product['stock'] < $qty) {
            $pdo->rollBack();
            json_error(
                sprintf('Only %d left of "%s". Please lower the quantity.', (int) $product['stock'], $product['name']),
                409
            );
        }

        $price = (float) $product['price'];
        $itemsTotal += $price * $qty;
        $lines[] = [
            'id' => $product['id'],
            'name' => (string) $product['name'],
            'price' => $price,
            'qty' => $qty,
        ];
    }

    if (!$lines) {
        $pdo->rollBack();
        json_error('Your cart is empty');
    }

    $shipping = (float) $method['cost'];
    $total = $itemsTotal + $shipping;

    $insertOrder = $pdo->prepare(
        'INSERT INTO orders
            (user_id, contact_name, contact_email, contact_phone, address,
             country, city, postal_code, delivery_method, shipping_cost,
             eta_from, eta_to, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $insertOrder->execute([
        $userId,
        $name,
        $user['email'],
        $phone,
        $address,
        $country,
        $city,
        $postal,
        $method['key'],
        number_format($shipping, 2, '.', ''),
        $eta['from'],
        $eta['to'],
        number_format($total, 2, '.', ''),
    ]);

    $orderId = (int) $pdo->lastInsertId();

    $insertItem = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, unit_price, qty)
         VALUES (?, ?, ?, ?, ?)'
    );
    $reduceStock = $pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    foreach ($lines as $line) {
        $insertItem->execute([
            $orderId,
            $line['id'],
            $line['name'],
            number_format($line['price'], 2, '.', ''),
            $line['qty'],
        ]);
        $reduceStock->execute([$line['qty'], $line['id']]);
    }

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
