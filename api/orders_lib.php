<?php
// Shared order queries. Kept apart from orders.php so admin.php can reuse them
// without executing that endpoint's request handling.
declare(strict_types=1);
require_once __DIR__ . '/db.php';

// $userId === null returns every order (admin view); otherwise it is scoped to
// one account, which is what keeps a customer from reading someone else's.
function orders_for(?int $userId, ?int $onlyOrderId = null): array
{
    $sql = 'SELECT o.id, o.user_id, o.contact_name, o.contact_email, o.contact_phone,
                   o.address, o.country, o.city, o.postal_code,
                   o.delivery_method, o.shipping_cost, o.eta_from, o.eta_to,
                   o.total, o.status, o.created_at
            FROM orders o';
    $params = [];
    $where = [];

    if ($userId !== null) {
        $where[] = 'o.user_id = ?';
        $params[] = $userId;
    }
    if ($onlyOrderId !== null) {
        $where[] = 'o.id = ?';
        $params[] = $onlyOrderId;
    }
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= ' ORDER BY o.created_at DESC, o.id DESC';

    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();
    if (!$orders) {
        return [];
    }

    $itemStmt = db()->prepare(
        'SELECT product_id, product_name, unit_price, qty
         FROM order_items WHERE order_id = ? ORDER BY id'
    );

    foreach ($orders as &$order) {
        $order['id'] = (int) $order['id'];
        $order['user_id'] = $order['user_id'] === null ? null : (int) $order['user_id'];
        $order['total'] = (float) $order['total'];
        $order['shipping_cost'] = (float) $order['shipping_cost'];

        $itemStmt->execute([$order['id']]);
        $items = $itemStmt->fetchAll();
        foreach ($items as &$item) {
            $item['unit_price'] = (float) $item['unit_price'];
            $item['qty'] = (int) $item['qty'];
        }
        unset($item);
        $order['items'] = $items;
    }
    unset($order);

    return $orders;
}
