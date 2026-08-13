# Deploying to InfinityFree

The site needs PHP and MySQL, so GitHub Pages cannot host it — Pages serves
static files only and would hand the browser the raw source of `.php` files.
This guide covers InfinityFree, but the steps match any shared host with
cPanel-style tooling.

## 1. Create the account and the site

1. Sign up at [infinityfree.com](https://infinityfree.com) and create a hosting
   account. You get a free subdomain such as `yourname.infinityfreeapp.com`.
2. Wait for the account to become active. New accounts can take a few minutes.

## 2. Create the database

In the control panel open **MySQL Databases** and create one.

The name is not yours to choose: it arrives with an account prefix, something
like `if0_00000000_shop`. Write down all four values shown afterwards — host,
database name, username, password. The host is a server name such as
`sqlXXX.infinityfree.com`, **not** `localhost`.

## 3. Import the schema

Open **phpMyAdmin** from the control panel, select the database you just
created, then use the **Import** tab and upload:

```
sql/schema-hosted.sql
```

Use that file, not `sql/schema.sql`. The local one begins with
`CREATE DATABASE` and `USE`, which shared hosting refuses — the database
already exists and you have no permission to create another.

You should end up with five tables: `users`, `cart_items`, `wishlist_items`,
`orders`, `order_items`.

## 4. Write the configuration

Copy `api/config.example.php` to `api/config.php` and fill in the four
database values from step 2.

`api/config.php` is deliberately **not** in git — the repository is public and
this file holds the database password. It has to be created by hand on every
machine and every server.

Keep `'https_only' => true`. It makes the browser send the session cookie only
over an encrypted connection.

## 5. Upload the files

Use the control panel's file manager or FTP, and upload the contents of the
project into the **`htdocs`** directory. That folder is the site root, so
`index.html` must sit directly inside it, not in a subfolder.

Upload these:

```
*.html  *.js  *.css  products.json  .htaccess
api/            (including the config.php you just wrote)
```

Do **not** upload:

- `sql/` — the schema is already imported, and the files only describe your
  database layout to anyone who asks for them
- `.git/` — the entire project history, including anything ever committed
- `DEPLOY.md`, `.gitignore`

The included `.htaccess` blocks direct access to `config.php`, the shared PHP
includes, and any `.sql`/`.md` file that slips through.

## 6. Turn on HTTPS

In the control panel open **Free SSL Certificates**, issue a certificate for
your domain, and wait for it to be installed. Then confirm that
`https://yoursite.infinityfreeapp.com` loads with a padlock.

Do not skip this. Registration and sign-in send passwords, and checkout sends
delivery addresses. Without HTTPS both travel in the clear.

## 7. Check that it works

Open the site and walk through the whole flow:

1. Register an account.
2. Add something to the cart, then sign out and sign back in — the cart should
   still be there, because it lives in the database now.
3. Place an order from the checkout page.
4. Open `orders.html` and confirm the order appears.

## 8. Make yourself an admin

Roles live in the database and are granted deliberately. In phpMyAdmin open the
`users` table, find your row, and change `role` from `user` to `admin`. Or run
this in the **SQL** tab:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email';
```

Sign out and back in, then open `admin.html`. The link also appears on the
account page for admin accounts.

## Updating the site later

There is no git deployment on the free plan, so re-upload the files you
changed. Two files stay put:

- **`api/config.php`** — never overwrite it with the example file
- **The database** — re-importing the schema is safe (`CREATE TABLE IF NOT
  EXISTS` skips existing tables) but will not migrate data

## Known limits of the free plan

- No SSH, so uploads are manual over FTP or the file manager
- Limited simultaneous MySQL connections; the site is fine for demos and light
  traffic, not for a launch
- Inactive accounts can be suspended
- No automatic backups. Export the database from phpMyAdmin yourself if the
  data starts to matter

**Do not keep real customers here.** The database holds password hashes and
delivery addresses of real people, and on a free plan you control neither the
server nor the backups. Move to paid hosting before taking genuine orders.
