<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';

require_method('POST');
require_csrf();

$body = read_json_body();
$email = trim((string) ($body['email'] ?? ''));
$password = (string) ($body['password'] ?? '');
$name = trim((string) ($body['name'] ?? ''));
$phone = trim((string) ($body['phone'] ?? ''));

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Please enter a valid email address');
}
if (mb_strlen($password) < 8) {
    json_error('Password must be at least 8 characters');
}
if (mb_strlen($email) > 255 || mb_strlen($name) > 120 || mb_strlen($phone) > 40) {
    json_error('One of the fields is too long');
}

$email = mb_strtolower($email);

// Cost of hashing is deliberate: it makes stolen hashes expensive to crack.
$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = db()->prepare(
        'INSERT INTO users (email, password_hash, name, phone) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$email, $hash, $name, $phone]);
} catch (PDOException $e) {
    // 23000 = unique constraint, i.e. the email is already registered.
    if ($e->getCode() === '23000') {
        json_error('An account with this email already exists', 409);
    }
    error_log('Register failed: ' . $e->getMessage());
    json_error('Could not create the account', 500);
}

$userId = (int) db()->lastInsertId();
login_user($userId);

json_out([
    'user' => [
        'id' => $userId,
        'email' => $email,
        'name' => $name,
        'phone' => $phone,
        'role' => 'user',
    ],
    'csrf' => csrf_token(),
], 201);
