<?php
// POST -> store a message for the shop's administrators.
// Open to signed-out visitors: someone who cannot sign in still needs a way
// to reach you.
declare(strict_types=1);
require_once __DIR__ . '/auth.php';

require_method('POST');
require_csrf();

const CONTACT_MAX_PER_HOUR = 5;

$user = current_user();

$body = read_json_body();
$name = trim((string) ($body['name'] ?? ''));
$email = mb_strtolower(trim((string) ($body['email'] ?? '')));
$subject = trim((string) ($body['subject'] ?? ''));
$message = trim((string) ($body['message'] ?? ''));

// A signed-in visitor does not retype what we already know
if ($user !== null) {
    if ($name === '') {
        $name = (string) $user['name'];
    }
    if ($email === '') {
        $email = (string) $user['email'];
    }
}

if ($name === '' || mb_strlen($name) > 120) {
    json_error('Please enter your name');
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255) {
    json_error('Please enter a valid email address so we can reply');
}
if (mb_strlen($subject) > 200) {
    json_error('Subject is too long');
}
if ($message === '') {
    json_error('Please write your message');
}
if (mb_strlen($message) > 5000) {
    json_error('Message is too long (5000 characters maximum)');
}

// Keeps the form from being used as a flood tool
$recent = db()->prepare(
    'SELECT COUNT(*) FROM messages WHERE email = ? AND created_at > (NOW() - INTERVAL 1 HOUR)'
);
$recent->execute([$email]);
if ((int) $recent->fetchColumn() >= CONTACT_MAX_PER_HOUR) {
    json_error('You have sent several messages already. Please wait a while before sending more.', 429);
}

$stmt = db()->prepare(
    'INSERT INTO messages (user_id, name, email, subject, body) VALUES (?, ?, ?, ?, ?)'
);
$stmt->execute([
    $user === null ? null : $user['id'],
    $name,
    $email,
    $subject,
    $message,
]);

json_out(['ok' => true], 201);
