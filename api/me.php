<?php
// GET  -> who is signed in (plus a CSRF token for the next write)
// POST -> update the signed-in user's own profile
declare(strict_types=1);
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $user = current_user();
    json_out([
        'user' => $user,          // null when signed out
        'csrf' => csrf_token(),
    ]);
}

if ($method === 'POST') {
    require_csrf();
    $user = require_login();

    $body = read_json_body();
    $name = trim((string) ($body['name'] ?? ''));
    $phone = trim((string) ($body['phone'] ?? ''));

    if (mb_strlen($name) > 120 || mb_strlen($phone) > 40) {
        json_error('One of the fields is too long');
    }

    // The id comes from the session, never from the request body, so a user
    // cannot edit somebody else's profile.
    $stmt = db()->prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?');
    $stmt->execute([$name, $phone, $user['id']]);

    json_out(['user' => current_user()]);
}

json_error('Method not allowed', 405);
