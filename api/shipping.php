<?php
// Delivery options and destinations.
//
// Kept server-side so the browser cannot invent a shipping price or a
// delivery date: checkout sends only the chosen method key, and the server
// looks up the cost and the estimate itself.
declare(strict_types=1);

function shipping_methods(): array
{
    return [
        'pickup' => [
            'key' => 'pickup',
            'label' => 'Pickup point',
            'note' => 'Collect from a local parcel locker or post office',
            'cost' => 0.00,
            'days_min' => 3,
            'days_max' => 6,
        ],
        'standard' => [
            'key' => 'standard',
            'label' => 'Standard courier',
            'note' => 'Delivered to your address',
            'cost' => 4.90,
            'days_min' => 2,
            'days_max' => 5,
        ],
        'express' => [
            'key' => 'express',
            'label' => 'Express courier',
            'note' => 'Priority handling, next working days',
            'cost' => 12.50,
            'days_min' => 1,
            'days_max' => 2,
        ],
    ];
}

function shipping_method(string $key): ?array
{
    return shipping_methods()[$key] ?? null;
}

// Countries the shop ships to. A free-text field would make the admin's order
// list unusable, so this is a fixed list shared by the form and the validator.
function shipping_countries(): array
{
    return [
        'Ukraine', 'Poland', 'Germany', 'Czechia', 'Slovakia', 'Hungary',
        'Romania', 'Moldova', 'Lithuania', 'Latvia', 'Estonia', 'Austria',
        'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Sweden',
        'Norway', 'Denmark', 'Finland', 'Portugal', 'Ireland',
        'United Kingdom', 'Switzerland', 'Canada', 'United States',
    ];
}

function is_shipping_country(string $country): bool
{
    return in_array($country, shipping_countries(), true);
}

// Working-day estimate: parcels are not handed over at weekends, so the
// window is pushed past them rather than landing on a Saturday.
function estimate_window(array $method): array
{
    $from = new DateTimeImmutable('today');
    $to = $from;

    $addWorkingDays = static function (DateTimeImmutable $date, int $days): DateTimeImmutable {
        while ($days > 0) {
            $date = $date->modify('+1 day');
            if ((int) $date->format('N') < 6) {
                $days--;
            }
        }
        return $date;
    };

    return [
        'from' => $addWorkingDays($from, (int) $method['days_min'])->format('Y-m-d'),
        'to' => $addWorkingDays($to, (int) $method['days_max'])->format('Y-m-d'),
    ];
}
