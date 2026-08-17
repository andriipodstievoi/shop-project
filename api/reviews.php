<?php
// GET  ?product_id=... -> reviews for one product
// POST {action: 'save', product_id, rating, body}   (signed in)
//      {action: 'delete', review_id}                (own review, or any as admin)
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/catalog.php';

function reviews_for(string $productId, ?int $viewerId): array
{
    $stmt = db()->prepare(
        'SELECT id, user_id, author_name, rating, body, created_at
         FROM reviews WHERE product_id = ? ORDER BY created_at DESC'
    );
    $stmt->execute([$productId]);

    $rows = [];
    foreach ($stmt->fetchAll() as $row) {
        $rows[] = [
            'id' => (int) $row['id'],
            'author_name' => $row['author_name'],
            'rating' => (int) $row['rating'],
            'body' => $row['body'],
            'created_at' => $row['created_at'],
            // Lets the page offer edit/delete only where it applies. Emails
            // are never exposed, so reviewers stay anonymous to each other.
            'is_mine' => $viewerId !== null && (int) $row['user_id'] === $viewerId,
        ];
    }
    return $rows;
}

function review_summary(string $productId): array
{
    $stmt = db()->prepare(
        'SELECT COUNT(*) AS total, AVG(rating) AS average FROM reviews WHERE product_id = ?'
    );
    $stmt->execute([$productId]);
    $row = $stmt->fetch();

    return [
        'total' => (int) $row['total'],
        'average' => $row['average'] === null ? null : round((float) $row['average'], 1),
    ];
}

$viewer = current_user();
$viewerId = $viewer === null ? null : (int) $viewer['id'];

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $productId = (string) ($_GET['product_id'] ?? '');
    if (!product_exists($productId)) {
        json_error('Unknown product', 404);
    }

    $mine = null;
    if ($viewerId !== null) {
        foreach (reviews_for($productId, $viewerId) as $r) {
            if ($r['is_mine']) {
                $mine = $r;
                break;
            }
        }
    }

    json_out([
        'reviews' => reviews_for($productId, $viewerId),
        'summary' => review_summary($productId),
        'mine' => $mine,
        'can_review' => $viewerId !== null,
    ]);
}

require_method('POST');
require_csrf();

$body = read_json_body();
$action = (string) ($body['action'] ?? '');

if ($action === 'delete') {
    $reviewId = (int) ($body['review_id'] ?? 0);
    if ($reviewId <= 0) {
        json_error('Invalid review');
    }

    $user = require_login();
    $isAdmin = ($user['role'] ?? '') === 'admin';

    // An admin may remove anything; everyone else only their own row, and the
    // ownership test is in the query rather than in a prior check.
    if ($isAdmin) {
        $stmt = db()->prepare('DELETE FROM reviews WHERE id = ?');
        $stmt->execute([$reviewId]);
    } else {
        $stmt = db()->prepare('DELETE FROM reviews WHERE id = ? AND user_id = ?');
        $stmt->execute([$reviewId, (int) $user['id']]);
    }

    if ($stmt->rowCount() === 0) {
        json_error('Review not found', 404);
    }

    json_out(['ok' => true]);
}

if ($action !== 'save') {
    json_error('Unknown action');
}

$user = require_login();
$productId = (string) ($body['product_id'] ?? '');
$rating = (int) ($body['rating'] ?? 0);
$text = trim((string) ($body['body'] ?? ''));

if (!product_exists($productId)) {
    json_error('Unknown product', 404);
}
if ($rating < 1 || $rating > 5) {
    json_error('Please choose a rating from 1 to 5');
}
if ($text === '') {
    json_error('Please write a few words about the product');
}
if (mb_strlen($text) > 2000) {
    json_error('Review is too long (2000 characters maximum)');
}

$author = trim((string) ($user['name'] ?? ''));
if ($author === '') {
    // Fall back to the part before @ so the full address is never published
    $author = explode('@', (string) $user['email'])[0];
}

// One review per account per product: a second submission edits the first.
$stmt = db()->prepare(
    'INSERT INTO reviews (product_id, user_id, author_name, rating, body)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), body = VALUES(body),
                             author_name = VALUES(author_name)'
);
$stmt->execute([$productId, (int) $user['id'], $author, $rating, $text]);

json_out([
    'reviews' => reviews_for($productId, (int) $user['id']),
    'summary' => review_summary($productId),
], 201);
