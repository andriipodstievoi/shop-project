// Catalog loading + cart/wishlist storage.
//
// Storage has two backends. A signed-in visitor reads and writes the database
// through /api, so the cart follows them between devices. A signed-out visitor
// keeps working against localStorage, and that guest data is folded into the
// account on sign-in (see Store.mergeGuestIntoAccount).
const CART_KEY = 'shop_cart';
const WISHLIST_KEY = 'shop_wishlist';

let PRODUCTS = [];
let productsById = {};
let SHIPPING_METHODS = {};
let catalogPromise = null;

// The catalog comes from the database via the API, so admin edits appear
// immediately and prices can never be supplied by the browser.
function loadCatalog() {
    if (!catalogPromise) {
        catalogPromise = fetch('api/products.php', { credentials: 'same-origin' })
            .then((res) => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then((data) => {
                PRODUCTS = Array.isArray(data.products) ? data.products : [];
                SHIPPING_METHODS = data.shipping || {};
                productsById = {};
                PRODUCTS.forEach((p) => { productsById[p.id] = p; });
                return PRODUCTS;
            })
            .catch((err) => {
                console.error('Could not load the catalog:', err.message);
                PRODUCTS = [];
                productsById = {};
                return PRODUCTS;
            });
    }
    return catalogPromise;
}

// A product shows its uploaded image when it has one, and falls back to the
// drawn SVG otherwise, so older products keep their illustrations.
function fillProductMedia(el, product) {
    el.style.background = product.icon.bg;
    el.style.color = product.icon.color;
    el.innerHTML = '';

    if (product.image_url) {
        const img = document.createElement('img');
        img.src = product.image_url;
        img.alt = product.name;
        img.loading = 'lazy';
        // A dead link falls back to the illustration rather than a broken icon
        img.addEventListener('error', () => {
            img.remove();
            el.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + (product.icon.svg || '') + '</svg>';
        });
        el.appendChild(img);
        return;
    }

    el.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + (product.icon.svg || '') + '</svg>';
}

function getProduct(id) {
    return productsById[id] || null;
}

function goToProduct(id) {
    window.location.href = 'empty.html?id=' + encodeURIComponent(id);
}

function formatPrice(value) {
    return '$' + value.toFixed(2);
}

/* ---------- Guest storage (localStorage) ---------- */

function readJSON(key, fallback) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key));
        return parsed === null ? fallback : parsed;
    } catch {
        return fallback;
    }
}

// Cart entries were once {name, price, qty}; those are resolved back to ids.
function normalizeCartEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const qty = Number.isFinite(entry.qty) && entry.qty > 0 ? Math.floor(entry.qty) : 1;
    if (entry.id && getProduct(entry.id)) return { id: entry.id, qty };
    const legacy = entry.name ? PRODUCTS.find((p) => p.name === entry.name) : null;
    return legacy ? { id: legacy.id, qty } : null;
}

function normalizeWishlistEntry(entry) {
    if (typeof entry === 'string') return getProduct(entry) ? entry : null;
    if (entry && entry.id && getProduct(entry.id)) return entry.id;
    const legacy = entry && entry.name ? PRODUCTS.find((p) => p.name === entry.name) : null;
    return legacy ? legacy.id : null;
}

function guestCart() {
    const raw = readJSON(CART_KEY, []);
    return Array.isArray(raw) ? raw.map(normalizeCartEntry).filter(Boolean) : [];
}

function saveGuestCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function guestWishlist() {
    const raw = readJSON(WISHLIST_KEY, []);
    return Array.isArray(raw) ? raw.map(normalizeWishlistEntry).filter(Boolean) : [];
}

function saveGuestWishlist(ids) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
}

/* ---------- Storage facade ---------- */

const Store = {
    async signedIn() {
        if (typeof Auth === 'undefined') return false;
        await Auth.load();
        return Auth.isLoggedIn();
    },

    async cart() {
        if (await Store.signedIn()) {
            try {
                const data = await Auth.get('api/cart.php');
                return data.items || [];
            } catch (err) {
                console.error('Cart load failed:', err.message);
                return [];
            }
        }
        return guestCart();
    },

    async addToCart(id) {
        if (!getProduct(id)) return;
        if (await Store.signedIn()) {
            await Auth.post('api/cart.php', { action: 'add', product_id: id });
        } else {
            const items = guestCart();
            const existing = items.find((i) => i.id === id);
            if (existing) {
                existing.qty = Math.min(existing.qty + 1, 99);
            } else {
                items.push({ id, qty: 1 });
            }
            saveGuestCart(items);
        }
        await updateCartBadge();
    },

    async setQty(id, qty) {
        if (await Store.signedIn()) {
            await Auth.post('api/cart.php', { action: 'set', product_id: id, qty });
        } else if (qty <= 0) {
            saveGuestCart(guestCart().filter((i) => i.id !== id));
        } else {
            const items = guestCart();
            const item = items.find((i) => i.id === id);
            if (item) {
                item.qty = Math.min(qty, 99);
                saveGuestCart(items);
            }
        }
        await updateCartBadge();
    },

    async removeFromCart(id) {
        if (await Store.signedIn()) {
            await Auth.post('api/cart.php', { action: 'remove', product_id: id });
        } else {
            saveGuestCart(guestCart().filter((i) => i.id !== id));
        }
        await updateCartBadge();
    },

    async wishlist() {
        if (await Store.signedIn()) {
            try {
                const data = await Auth.get('api/wishlist.php');
                return data.items || [];
            } catch (err) {
                console.error('Wishlist load failed:', err.message);
                return [];
            }
        }
        return guestWishlist();
    },

    async toggleWishlist(id) {
        if (!getProduct(id)) return false;
        if (await Store.signedIn()) {
            const data = await Auth.post('api/wishlist.php', { action: 'toggle', product_id: id });
            return (data.items || []).includes(id);
        }
        const list = guestWishlist();
        const idx = list.indexOf(id);
        if (idx > -1) {
            list.splice(idx, 1);
        } else {
            list.push(id);
        }
        saveGuestWishlist(list);
        return idx === -1;
    },

    async removeFromWishlist(id) {
        if (await Store.signedIn()) {
            await Auth.post('api/wishlist.php', { action: 'remove', product_id: id });
        } else {
            saveGuestWishlist(guestWishlist().filter((entry) => entry !== id));
        }
    },

    // Called right after sign-in/registration: whatever the visitor collected
    // while signed out is added to the account, then the local copy is cleared
    // so it cannot be merged twice.
    async mergeGuestIntoAccount() {
        await loadCatalog();
        const items = guestCart();
        const wishes = guestWishlist();

        try {
            if (items.length) {
                await Auth.post('api/cart.php', { action: 'merge', items });
            }
            if (wishes.length) {
                await Auth.post('api/wishlist.php', { action: 'merge', items: wishes });
            }
        } catch (err) {
            console.error('Merge failed:', err.message);
            return;
        }

        localStorage.removeItem(CART_KEY);
        localStorage.removeItem(WISHLIST_KEY);
    }
};

/* ---------- Badge ---------- */

async function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    if (!badges.length) return;
    const items = await Store.cart();
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    badges.forEach((badge) => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

/* ---------- Button wiring ---------- */

// Pages render their own buttons and call these, and the DOMContentLoaded
// handler below also sweeps the whole document. Without this guard a button
// caught by both ends up with two click handlers, which added an item twice
// and made a wishlist toggle fire twice and cancel itself out.
function markBound(btn) {
    if (btn.dataset.bound === '1') return false;
    btn.dataset.bound = '1';
    return true;
}

function initAddToCartButtons(root = document) {
    root.querySelectorAll('.add-cart-btn').forEach((btn) => {
        if (!markBound(btn)) return;
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const original = btn.innerHTML;
            btn.disabled = true;
            try {
                await Store.addToCart(btn.dataset.id);
                btn.classList.add('added');
                btn.textContent = 'Added ✓';
            } catch (err) {
                btn.textContent = 'Failed';
                console.error(err);
            }
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = original;
                btn.disabled = false;
            }, 900);
        });
    });
}

async function initWishlistButtons(root = document) {
    const buttons = root.querySelectorAll('.wishlist-btn');
    if (!buttons.length) return;

    const list = await Store.wishlist();

    buttons.forEach((btn) => {
        const id = btn.dataset.id;
        const active = list.includes(id);
        // State is refreshed even on a button that is already wired
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
        btn.setAttribute('aria-label', (active ? 'Remove from' : 'Add to') + ' wishlist');

        if (!markBound(btn)) return;

        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            btn.disabled = true;
            try {
                const nowIn = await Store.toggleWishlist(id);
                btn.classList.toggle('active', nowIn);
                btn.setAttribute('aria-pressed', String(nowIn));
                btn.setAttribute('aria-label', (nowIn ? 'Remove from' : 'Add to') + ' wishlist');
            } catch (err) {
                console.error(err);
            }
            btn.disabled = false;
        });
    });
}

/* ---------- Shared row pieces ---------- */

// Only our own catalog SVG is assigned as markup; text uses textContent.
function buildItemMedia(product, priceLabel) {
    const illustration = document.createElement('div');
    illustration.className = 'cart-item-illustration';
    fillProductMedia(illustration, product);

    const info = document.createElement('div');
    info.className = 'cart-item-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'cart-item-name';
    nameEl.textContent = product.name;

    const priceEl = document.createElement('div');
    priceEl.className = 'cart-item-price';
    priceEl.textContent = priceLabel;

    info.append(nameEl, priceEl);

    [illustration, info].forEach((el) => {
        el.addEventListener('click', () => goToProduct(product.id));
    });

    const fragment = document.createDocumentFragment();
    fragment.append(illustration, info);
    return fragment;
}

function makeIconButton(className, label, symbol) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.setAttribute('aria-label', label);
    btn.textContent = symbol;
    return btn;
}

function renderEmptyState(container, message) {
    const p = document.createElement('p');
    p.className = 'cart-empty';
    p.textContent = message + ' ';
    const link = document.createElement('a');
    link.href = 'products.html';
    link.textContent = 'Browse products';
    p.appendChild(link);
    container.appendChild(p);
}

/* ---------- Cart page ---------- */

async function renderCartPage() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    const totalEl = document.getElementById('cartTotal');
    const summaryEl = document.getElementById('cartSummary');
    const continueEl = document.getElementById('cartContinueLink');
    const actionsEl = document.getElementById('cartActions');

    async function refresh() {
        const cart = await Store.cart();
        container.innerHTML = '';

        if (cart.length === 0) {
            renderEmptyState(container, 'Your cart is empty.');
            if (summaryEl) summaryEl.style.display = 'none';
            if (continueEl) continueEl.style.display = 'none';
            if (actionsEl) actionsEl.style.display = 'none';
            return;
        }

        if (summaryEl) summaryEl.style.display = 'flex';
        if (continueEl) continueEl.style.display = 'block';
        if (actionsEl) actionsEl.style.display = 'flex';

        let total = 0;

        cart.forEach((item) => {
            const product = getProduct(item.id);
            if (!product) return;
            total += product.price * item.qty;

            const row = document.createElement('div');
            row.className = 'cart-item';
            row.appendChild(buildItemMedia(product, formatPrice(product.price) + ' each'));

            const decBtn = makeIconButton('qty-btn', 'Decrease quantity', '−');
            decBtn.addEventListener('click', async () => {
                await Store.setQty(item.id, item.qty - 1);
                await refresh();
            });

            const qtyValue = document.createElement('span');
            qtyValue.className = 'qty-value';
            qtyValue.textContent = item.qty;

            const incBtn = makeIconButton('qty-btn', 'Increase quantity', '+');
            incBtn.addEventListener('click', async () => {
                await Store.setQty(item.id, item.qty + 1);
                await refresh();
            });

            const qtyControls = document.createElement('div');
            qtyControls.className = 'qty-controls';
            qtyControls.append(decBtn, qtyValue, incBtn);

            const lineTotal = document.createElement('div');
            lineTotal.className = 'cart-item-total';
            lineTotal.textContent = formatPrice(product.price * item.qty);

            const removeBtn = makeIconButton('remove-btn', 'Remove ' + product.name, '✕');
            removeBtn.addEventListener('click', async () => {
                await Store.removeFromCart(item.id);
                await refresh();
            });

            row.append(qtyControls, lineTotal, removeBtn);
            container.appendChild(row);
        });

        if (totalEl) totalEl.textContent = formatPrice(total);
    }

    await refresh();
}

/* ---------- Wishlist page ---------- */

async function renderWishlistPage() {
    const container = document.getElementById('wishlistItems');
    if (!container) return;

    async function refresh() {
        const list = await Store.wishlist();
        container.innerHTML = '';

        if (list.length === 0) {
            renderEmptyState(container, 'Your wishlist is empty.');
            return;
        }

        list.forEach((id) => {
            const product = getProduct(id);
            if (!product) return;

            const row = document.createElement('div');
            row.className = 'cart-item';
            row.appendChild(buildItemMedia(product, formatPrice(product.price)));

            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.className = 'btn btn-buy add-cart-btn';
            addBtn.dataset.id = product.id;
            addBtn.textContent = 'Add to cart';

            const removeBtn = makeIconButton('remove-btn', 'Remove ' + product.name, '✕');
            removeBtn.addEventListener('click', async () => {
                await Store.removeFromWishlist(product.id);
                await refresh();
            });

            row.append(addBtn, removeBtn);
            container.appendChild(row);
        });

        initAddToCartButtons(container);
    }

    await refresh();
}

/* ---------- Sync banner ---------- */

// Tells signed-out visitors why their cart is not following them around.
async function initSyncNotice() {
    const notice = document.getElementById('syncNotice');
    if (!notice) return;
    notice.hidden = await Store.signedIn();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadCatalog();
    await updateCartBadge();
    initAddToCartButtons();
    await initWishlistButtons();
    await initSyncNotice();
    await renderCartPage();
    await renderWishlistPage();
});
