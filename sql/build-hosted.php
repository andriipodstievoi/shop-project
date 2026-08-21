<?php
// Regenerates sql/schema-hosted.sql from sql/schema.sql.
//
// Run after every change to schema.sql:
//     php sql/build-hosted.php
//
// The hosted variant is the same schema minus CREATE DATABASE and USE, because
// shared hosting creates the database in its control panel with a fixed
// prefixed name and refuses those statements. Generating it instead of
// maintaining it by hand is deliberate: the hand-kept copy silently fell four
// tables behind.
declare(strict_types=1);

$dir = __DIR__;
$source = $dir . '/schema.sql';
$target = $dir . '/schema-hosted.sql';

$sql = file_get_contents($source);
if ($sql === false) {
    fwrite(STDERR, "Cannot read $source\n");
    exit(1);
}

// Drop the local-only header, the CREATE DATABASE block and the USE line
$sql = preg_replace('~^--.*?\n\n~s', '', $sql, 1);
$sql = preg_replace('~CREATE DATABASE.*?;\s*~s', '', $sql, 1);
$sql = preg_replace('~^USE .*?;\s*~m', '', $sql);

$header = <<<TXT
-- Schema for shared hosting (InfinityFree and similar).
--
-- GENERATED FILE - do not edit by hand.
-- Produced from sql/schema.sql by: php sql/build-hosted.php
--
-- Unlike sql/schema.sql this file does NOT create or select a database: on
-- shared hosting you create it in the control panel, it gets a fixed name such
-- as if0_12345678_shop, and you import this file INTO it via phpMyAdmin.
-- Running CREATE DATABASE there would fail on permissions.


TXT;

file_put_contents($target, $header . ltrim($sql));

$tables = [];
preg_match_all('~CREATE TABLE IF NOT EXISTS ([a-z_]+)~', $sql, $m);
$tables = $m[1];

echo "wrote schema-hosted.sql with " . count($tables) . " tables: " . implode(', ', $tables) . "\n";
