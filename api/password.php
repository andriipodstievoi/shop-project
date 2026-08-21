<?php
// POST {current_password, new_password} -> change the signed-in user's password
declare(strict_types=1);
require_once __DIR__ . '/auth.php';

require_method('POST');
require_csrf();

$user = require_login();

$body = read_json_body();
$current = (string) ($body['current_password'] ?? '');
$new = (string) ($body['new_password'] ?? '');

if ($current === '' || $new === '') {
    json_error('Both the current and the new password are required');
}
if (mb_strlen($new) < 8) {
    json_error('The new password must be at least 8 characters');
}
if ($new === $current) {
    json_error('The new password must be different from the current one');
}

// The current password is re-checked even though the session is valid, so a
// hijacked session cannot be used to lock the real owner out of the account.
$stmt = db()->prepare('SELECT password_hash FROM users WHERE id = ?');
$stmt->execute([$user['id']]);
$row = $stmt->fetch();

if (!$row || !password_verify($current, $row['password_hash'])) {
    usleep(300000);
    json_error('Current password is incorrect', 401);
}

$update = db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
$update->execute([password_hash($new, PASSWORD_DEFAULT), $user['id']]);

// A new session id means any other session holding the old password is not
// silently carried over.
session_regenerate_id(true);

json_out(['ok' => true, 'csrf' => csrf_token()]);
