<?php
// Copy this file to config.php and fill in your own values.
// config.php is gitignored: it must never be committed, because this
// repository is public.

return [
    'db_host' => '127.0.0.1',
    'db_name' => 'shop_db',
    'db_user' => 'root',
    // XAMPP's default MySQL root password is empty. On a real host, use a
    // dedicated user with a strong password instead of root.
    'db_pass' => '',

    // Set to true once the site is served over HTTPS, so the session cookie
    // is only ever sent on encrypted connections.
    'https_only' => false,
];
