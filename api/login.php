<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';

require_method('POST');
require_csrf();

// Two separate ceilings on purpose. The per-email one is tight, because
// failures against a single account are what password guessing looks like.
// The per-IP one is far looser: a household, an office or a mobile carrier
// shares one address, and a tight limit there locks out innocent people.
const MAX_ATTEMPTS_EMAIL = 8;
const MAX_ATTEMPTS_IP = 30;
const ATTEMPT_WINDOW_MIN = 15; // rolling window

$body = read_json_body();
$email = mb_strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');

if ($email === '' || $password === '') {
    json_error('Email and password are required');
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');

// Throttling. Without this a public site lets an attacker try passwords
// forever; the email counter stops one account being targeted and the IP
// counter stops one source spraying many accounts.
$countStmt = db()->prepare(
    'SELECT
        SUM(email = ?) AS by_email,
        SUM(ip <> \'\' AND ip = ?) AS by_ip
     FROM login_attempts
     WHERE successful = 0
       AND attempted_at > (NOW() - INTERVAL ? MINUTE)'
);
$countStmt->execute([$email, $ip, ATTEMPT_WINDOW_MIN]);
$counts = $countStmt->fetch();

$byEmail = (int) ($counts['by_email'] ?? 0);
$byIp = (int) ($counts['by_ip'] ?? 0);

if ($byEmail >= MAX_ATTEMPTS_EMAIL || $byIp >= MAX_ATTEMPTS_IP) {
    json_error(
        'Too many sign-in attempts. Please wait ' . ATTEMPT_WINDOW_MIN . ' minutes and try again.',
        429
    );
}

$record = db()->prepare('INSERT INTO login_attempts (email, ip, successful) VALUES (?, ?, ?)');

$stmt = db()->prepare('SELECT id, email, password_hash, name, phone, role FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

// One generic message for both "no such email" and "wrong password", so the
// response cannot be used to discover which emails are registered.
if (!$user || !password_verify($password, $user['password_hash'])) {
    $record->execute([$email, $ip, 0]);
    usleep(300000);
    json_error('Incorrect email or password', 401);
}

// Transparently upgrade the stored hash if PHP's default algorithm changed.
if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
    $rehash = password_hash($password, PASSWORD_DEFAULT);
    $update = db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $update->execute([$rehash, $user['id']]);
}

$record->execute([$email, $ip, 1]);

// A successful sign-in clears the counter, so a user who mistyped a few times
// is not left locked out afterwards.
$clear = db()->prepare('DELETE FROM login_attempts WHERE email = ? AND successful = 0');
$clear->execute([$email]);

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
