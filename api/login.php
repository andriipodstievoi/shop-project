<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';

require_method('POST');
require_csrf();

$body = read_json_body();
$email = mb_strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');

if ($email === '' || $password === '') {
    json_error('Email and password are required');
}

$stmt = db()->prepare('SELECT id, email, password_hash, name, phone, role FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

// One generic message for both "no such email" and "wrong password", so the
// response cannot be used to discover which emails are registered.
if (!$user || !password_verify($password, $user['password_hash'])) {
    usleep(300000);
    json_error('Incorrect email or password', 401);
}

// Transparently upgrade the stored hash if PHP's default algorithm changed.
if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
    $rehash = password_hash($password, PASSWORD_DEFAULT);
    $update = db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $update->execute([$rehash, $user['id']]);
}

login_user((int) $user['id']);

json_out([
    'user' => [
        'id' => (int) $user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
        'phone' => $user['phone'],
        'role' => $user['role'],
    ],
    'csrf' => csrf_token(),
]);
