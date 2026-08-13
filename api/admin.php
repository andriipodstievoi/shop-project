<?php
// Admin-only. GET ?resource=summary|users|orders
//             POST {action:'set_status', order_id, status}
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/orders_lib.php';

// Every path below runs only for an account whose role is 'admin' in the
// database. The hidden link on account.html is convenience, not security.
$admin = require_admin();

const ALLOWED_STATUSES = ['new', 'processing', 'shipped', 'completed', 'cancelled'];

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

        json_out([
            'users' => $users,
            'orders' => $orderCount,
            'revenue' => round($revenue, 2),
            'pending' => $pending,
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

    json_error('Unknown resource');
}

require_method('POST');
require_csrf();

$body = read_json_body();

if (($body['action'] ?? '') !== 'set_status') {
    json_error('Unknown action');
}

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
