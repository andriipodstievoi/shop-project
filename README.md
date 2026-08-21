# Shop

A small clothing shop built from scratch: catalog with search, accounts, cart,
checkout with delivery options, customer reviews, and an admin panel.

**Live:** https://andriipodstievoi-web.freehosting.dev

Plain PHP, MySQL and vanilla JavaScript — no frameworks, no build step. The
point was to write the parts a framework usually hides: sessions, CSRF, access
control, transactions.

---

## What it does

**Storefront** — a catalog with live search over name, category and
description, sidebar filters, sorting, and stock shown on every card. Product
pages carry a photo/video gallery, specifications, and reviews.

**Accounts** — registration and sign-in with hashed passwords, editable
profile, password change, and sign-in throttling.

**Cart and wishlist** — kept in the database for signed-in visitors, so they
follow the account between devices. A signed-out visitor still gets a working
cart in `localStorage`, and it is merged into the account on sign-in.

**Checkout** — country, address and a delivery method priced and dated on the
server, stock verified across every line, and an order written in one
transaction. Customers can cancel an order while it is still new.

**Reviews** — one per account per product; a product's rating is averaged from
them.

**Admin panel** — orders with status control, full product CRUD including
gallery and specifications, contact messages, and the user list.

There is **no online payment**: taking card details needs a payment provider,
so checkout says plainly that the shop makes contact to confirm.

---

## How it is put together

```
*.html            pages; markup only, no data
cart.js           catalog loading + cart/wishlist, server or localStorage
catalog.js        the shop grid: search, filters, sorting
product-page.js   product page: gallery, tabs, reviews, related strips
auth.js           thin wrapper over the API, holds the CSRF token
api/*.php         JSON endpoints
sql/              schema, migrations, generators
```

Three ideas run through it.

**One source of truth for products.** The catalog lives in the `products` table.
URLs carry only `?id=`, so a crafted link cannot invent a price, and the cart
stores ids rather than prices, so a price change is never applied retroactively
to an open cart. Order lines are the deliberate exception: they copy the name
and price at checkout, because a later price change must not rewrite what a
customer already paid.

**The server decides.** Prices, shipping cost, delivery estimates and access
rights are all computed server-side. The browser sends a product id or a
delivery method key and nothing else that matters.

**Generated files stay generated.** `schema-hosted.sql`, `seed-products.sql`
and `repair-icons.sql` are produced by scripts in `sql/`. The hand-maintained
version of the first one silently fell four tables behind, which is exactly the
kind of drift a generator prevents.

---

## Security

Worth reading if you are reviewing this, because most of it is invisible from
the outside.

- **Passwords** are stored only as `password_hash()` digests. Sign-in returns
  one generic error for both an unknown email and a wrong password, so the
  response cannot be used to discover who has an account.
- **Sign-in throttling** with two ceilings: tight per email, loose per IP.
  A single shared counter would lock out everyone behind one office address.
- **SQL** goes through prepared statements with emulation off.
- **CSRF** token required on every state-changing request; the session id is
  regenerated on sign-in and on password change.
- **Session cookie** is `httponly` and `secure`, so JavaScript cannot read it.
- **XSS**: product text is written with `textContent` and DOM nodes, never
  interpolated into `innerHTML`. This one was a real bug once — a crafted
  `?product=` link could run script on the cart page — and the fix is in the
  history.
- **Access control** is server-side. The admin link is hidden in the UI for
  convenience, but every admin endpoint checks the role in the database; a
  plain account calling them directly gets 403.
- **Secrets** never reach the repository: `api/config.php` is gitignored and
  `.htaccess` denies it, along with the shared includes and the `sql/` files.
- **Headers**: `nosniff`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy` and a partial CSP.

The front-end code is readable by anyone, and that is fine — nothing in it is
secret. That is the point of putting every decision on the server.

---

## Running it locally

Needs PHP 8.1+ and MySQL. XAMPP gives you both.

```bash
# 1. database
mysql -u root < sql/schema.sql
mysql -u root shop_db < sql/seed-products.sql

# 2. configuration
cp api/config.example.php api/config.php   # then fill in your database details

# 3. serve it (Apache, or PHP's built-in server)
php -S 127.0.0.1:8000
```

Open `http://127.0.0.1:8000`. Opening the files directly from disk will not
work — the API needs PHP.

To make yourself an admin, register first, then:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Deployment to shared hosting is covered in [DEPLOY.md](DEPLOY.md).

---

## What I would do differently

**Move the inline scripts into files.** Several pages still carry a
`<script>` block, which is why the CSP has to allow `unsafe-inline`. Moving
them out is the single change that would make the policy worth having.

**Add automated tests.** Everything here was verified by hand, and one class
of bug got through twice for the same reason: the logic was checked by calling
functions directly instead of clicking the rendered page. A handful of browser
tests over checkout and the cart would have caught both.

**Rethink the guest cart merge.** Quantities are added together on sign-in.
Taking the larger of the two would probably surprise people less.

**Paginate the catalog.** Everything is loaded at once, which is fine for a
few dozen products and wrong for a few thousand.

**Product images** are external URLs. Uploading with resizing would be better,
but on free hosting the storage and file-type checks are their own project.

---

## Notes

Built with Claude Code as a pair-programming exercise. The commit history is
deliberately detailed — each message explains why a change was made and how it
was verified, and several document bugs found and fixed along the way.
