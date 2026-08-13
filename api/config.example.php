<?php
// Copy this file to config.php and fill in your own values.
// config.php is gitignored: it must never be committed, because this
// repository is public.

return [
    // ---- Local development (XAMPP) ----
    // 'db_host' => '127.0.0.1',
    // 'db_name' => 'shop_db',
    // 'db_user' => 'root',
    // 'db_pass' => '',
    // 'https_only' => false,

    // ---- Shared hosting (InfinityFree and similar) ----
    // Take these four values from the control panel under "MySQL Databases".
    // The host is a server name, not localhost, and the database and user
    // names carry an account prefix you cannot change.
    'db_host' => 'sqlXXX.infinityfree.com',
    'db_name' => 'if0_00000000_shop',
    'db_user' => 'if0_00000000',
    'db_pass' => 'YOUR_DATABASE_PASSWORD',

    // Set to true as soon as the site is reachable over https, so the session
    // cookie is never sent over an unencrypted connection. Leaving this false
    // on a live site means a password can be read off the wire.
    'https_only' => true,
];
