<?php
// Countries the shop delivers to. Shared by the checkout form and the
// server-side validator, so the two can never disagree.
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/shipping.php';

require_method('GET');

json_out(['countries' => shipping_countries()]);
