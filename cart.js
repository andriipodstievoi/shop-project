// Shared product catalog + cart/wishlist/profile storage, used by every page.
// The catalog below is the single source of truth: pages render from it, the
// cart stores only ids, and prices are always looked up here rather than taken
// from the URL, so a crafted link cannot invent a price.
// The profile now lives in the database (see api/me.php); only the cart and
// wishlist are still browser-local, until stage 2 moves them server-side too.
const CART_KEY = 'shop_cart';
const WISHLIST_KEY = 'shop_wishlist';

const PRODUCTS = [
    {
        id: 'nebula-hoodie',
        name: 'Nebula Hoodie',
        price: 68.00,
        category: 'Outerwear',
        rating: 4.6,
        reviews: 214,
        blurb: 'A heavyweight fleece hoodie with a brushed interior, dropped shoulders, and a kangaroo pocket. Built for cold mornings.',
        icon: {
            color: '#6d28d9',
            bg: 'radial-gradient(circle, #ede9fe, #c4b5fd)',
            svg: '<path fill="currentColor" d="M30 26 Q50 6 70 26 L70 34 Q50 24 30 34 Z"/><rect x="30" y="30" width="40" height="55" rx="10" fill="currentColor"/><rect x="10" y="34" width="18" height="34" rx="8" fill="currentColor" transform="rotate(-15 19 51)"/><rect x="72" y="34" width="18" height="34" rx="8" fill="currentColor" transform="rotate(15 81 51)"/><rect x="40" y="60" width="20" height="14" rx="4" fill="rgba(0,0,0,0.15)"/><circle cx="45" cy="34" r="2" fill="rgba(0,0,0,0.25)"/><circle cx="55" cy="34" r="2" fill="rgba(0,0,0,0.25)"/>'
        }
    },
    {
        id: 'solstice-sneakers',
        name: 'Solstice Sneakers',
        price: 92.00,
        category: 'Footwear',
        rating: 4.4,
        reviews: 168,
        blurb: 'Lightweight everyday sneakers with a breathable knit upper and a cushioned sole made for standing all day.',
        icon: {
            color: '#c2410c',
            bg: 'radial-gradient(circle, #ffedd5, #fdba74)',
            svg: '<path fill="currentColor" d="M12 66 Q12 54 24 52 L50 44 Q62 40 72 46 L86 54 Q92 57 92 64 L92 70 Q92 74 88 74 L18 74 Q12 74 12 68 Z"/><rect x="12" y="70" width="80" height="8" rx="4" fill="rgba(0,0,0,0.2)"/><path fill="rgba(0,0,0,0.15)" d="M24 52 L50 44 Q54 50 50 56 L28 62 Z"/>'
        }
    },
    {
        id: 'aurora-backpack',
        name: 'Aurora Backpack',
        price: 54.00,
        category: 'Accessories',
        rating: 4.7,
        reviews: 302,
        blurb: 'A 20L daypack with a padded laptop sleeve, water-resistant shell, and enough pockets to keep you organized.',
        icon: {
            color: '#0f766e',
            bg: 'radial-gradient(circle, #ccfbf1, #5eead4)',
            svg: '<rect x="28" y="26" width="44" height="58" rx="16" fill="currentColor"/><path d="M38 26 Q38 12 50 12 Q62 12 62 26" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><rect x="36" y="38" width="28" height="18" rx="5" fill="rgba(0,0,0,0.18)"/><rect x="42" y="62" width="16" height="16" rx="4" fill="rgba(0,0,0,0.12)"/>'
        }
    },
    {
        id: 'meridian-chinos',
        name: 'Meridian Chinos',
        price: 58.00,
        category: 'Bottoms',
        rating: 4.3,
        reviews: 97,
        blurb: 'Straight-leg cotton chinos with a touch of stretch, a clean tapered ankle, and pockets that actually hold a phone.',
        icon: {
            color: '#92400e',
            bg: 'radial-gradient(circle, #fef3c7, #fcd34d)',
            svg: '<rect x="30" y="16" width="40" height="10" rx="2" fill="currentColor"/><path fill="currentColor" d="M30 26 h18 l-3 58 h-13 z"/><path fill="currentColor" d="M52 26 h18 l-2 58 h-13 z"/><rect x="30" y="26" width="40" height="4" fill="rgba(0,0,0,0.15)"/><rect x="47" y="26" width="6" height="15" fill="rgba(0,0,0,0.1)"/>'
        }
    },
    {
        id: 'cloudstep-socks',
        name: 'Cloudstep Socks (3-pack)',
        price: 14.00,
        category: 'Socks',
        rating: 4.8,
        reviews: 421,
        blurb: 'Cushioned combed-cotton crew socks with a reinforced heel and a ribbed cuff that stays up all day.',
        icon: {
            color: '#9f1239',
            bg: 'radial-gradient(circle, #ffe4e6, #fda4af)',
            svg: '<path fill="currentColor" d="M40 16 H60 V56 H72 A11 11 0 0 1 72 78 H50 A10 10 0 0 1 40 68 Z"/><rect x="40" y="16" width="20" height="7" fill="rgba(0,0,0,0.2)"/><rect x="40" y="60" width="12" height="5" fill="rgba(0,0,0,0.12)"/>'
        }
    },
    {
        id: 'everyday-boxer-briefs',
        name: 'Everyday Boxer Briefs (2-pack)',
        price: 22.00,
        category: 'Underwear',
        rating: 4.5,
        reviews: 256,
        blurb: 'Breathable modal-blend boxer briefs with a soft waistband and a no-ride-up leg that stays put.',
        icon: {
            color: '#1e40af',
            bg: 'radial-gradient(circle, #dbeafe, #93c5fd)',
            svg: '<rect x="28" y="28" width="44" height="9" rx="2" fill="currentColor"/><path fill="currentColor" d="M28 37 H72 L69 58 Q66 70 56 70 Q50 70 50 61 Q50 70 44 70 Q34 70 31 58 Z"/><rect x="28" y="37" width="44" height="3" fill="rgba(0,0,0,0.15)"/>'
        }
    }
];

function getProduct(id) {
    return PRODUCTS.find((p) => p.id === id) || null;
}

function findProductByName(name) {
    return PRODUCTS.find((p) => p.name === name) || null;
}

function goToProduct(id) {
    window.location.href = 'empty.html?id=' + encodeURIComponent(id);
}

function formatPrice(value) {
    return '$' + value.toFixed(2);
}

/* ---------- Storage helpers ---------- */

function readJSON(key, fallback) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key));
        return parsed === null ? fallback : parsed;
    } catch {
        return fallback;
    }
}

// Entries used to be stored as {name, price, qty}. Anything still in that shape
// is resolved back to a catalog id; unknown products are dropped.
function normalizeCartEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const qty = Number.isFinite(entry.qty) && entry.qty > 0 ? Math.floor(entry.qty) : 1;
    if (entry.id && getProduct(entry.id)) return { id: entry.id, qty };
    const legacy = entry.name ? findProductByName(entry.name) : null;
    return legacy ? { id: legacy.id, qty } : null;
}

function normalizeWishlistEntry(entry) {
    if (typeof entry === 'string') return getProduct(entry) ? entry : null;
    if (entry && entry.id && getProduct(entry.id)) return entry.id;
    const legacy = entry && entry.name ? findProductByName(entry.name) : null;
    return legacy ? legacy.id : null;
}

/* ---------- Cart ---------- */

function getCart() {
    const raw = readJSON(CART_KEY, []);
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeCartEntry).filter(Boolean);
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(id) {
    if (!getProduct(id)) return;
    const cart = getCart();
    const existing = cart.find((item) => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, qty: 1 });
    }
    saveCart(cart);
}

function removeFromCart(id) {
    saveCart(getCart().filter((item) => item.id !== id));
}

function setQty(id, qty) {
    if (qty <= 0) {
        removeFromCart(id);
        return;
    }
    const cart = getCart();
    const item = cart.find((i) => i.id === id);
    if (item) {
        item.qty = qty;
        saveCart(cart);
    }
}

function cartCount() {
    return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
    const count = cartCount();
    document.querySelectorAll('.cart-badge').forEach((badge) => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

function initAddToCartButtons(root = document) {
    root.querySelectorAll('.add-cart-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(btn.dataset.id);
            const original = btn.innerHTML;
            btn.classList.add('added');
            btn.textContent = 'Added ✓';
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = original;
            }, 900);
        });
    });
}

/* ---------- Wishlist ---------- */

function getWishlist() {
    const raw = readJSON(WISHLIST_KEY, []);
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeWishlistEntry).filter(Boolean);
}

function saveWishlist(ids) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
}

function isInWishlist(id) {
    return getWishlist().includes(id);
}

function toggleWishlist(id) {
    if (!getProduct(id)) return false;
    const list = getWishlist();
    const idx = list.indexOf(id);
    if (idx > -1) {
        list.splice(idx, 1);
    } else {
        list.push(id);
    }
    saveWishlist(list);
    return idx === -1;
}

function removeFromWishlist(id) {
    saveWishlist(getWishlist().filter((entry) => entry !== id));
}

function initWishlistButtons(root = document) {
    root.querySelectorAll('.wishlist-btn').forEach((btn) => {
        const id = btn.dataset.id;
        const active = isInWishlist(id);
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
        btn.setAttribute('aria-label', (active ? 'Remove from' : 'Add to') + ' wishlist');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const nowIn = toggleWishlist(id);
            btn.classList.toggle('active', nowIn);
            btn.setAttribute('aria-pressed', String(nowIn));
            btn.setAttribute('aria-label', (nowIn ? 'Remove from' : 'Add to') + ' wishlist');
        });
    });
}

/* ---------- Shared row pieces ---------- */

// Product text always goes through textContent; only our own catalog SVG is
// assigned as markup.
function buildItemMedia(product, priceLabel) {
    const illustration = document.createElement('div');
    illustration.className = 'cart-item-illustration';
    illustration.style.background = product.icon.bg;
    illustration.style.color = product.icon.color;
    illustration.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + product.icon.svg + '</svg>';

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

/* ---------- Cart page rendering ---------- */

function renderCartPage() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    const totalEl = document.getElementById('cartTotal');
    const summaryEl = document.getElementById('cartSummary');
    const continueEl = document.getElementById('cartContinueLink');

    function refresh() {
        const cart = getCart();
        container.innerHTML = '';

        if (cart.length === 0) {
            renderEmptyState(container, 'Your cart is empty.');
            if (summaryEl) summaryEl.style.display = 'none';
            if (continueEl) continueEl.style.display = 'none';
            return;
        }

        if (summaryEl) summaryEl.style.display = 'flex';
        if (continueEl) continueEl.style.display = 'block';

        let total = 0;

        cart.forEach((item) => {
            const product = getProduct(item.id);
            if (!product) return;
            total += product.price * item.qty;

            const row = document.createElement('div');
            row.className = 'cart-item';
            row.appendChild(buildItemMedia(product, formatPrice(product.price) + ' each'));

            const decBtn = makeIconButton('qty-btn', 'Decrease quantity', '−');
            decBtn.addEventListener('click', () => {
                setQty(item.id, item.qty - 1);
                refresh();
            });

            const qtyValue = document.createElement('span');
            qtyValue.className = 'qty-value';
            qtyValue.textContent = item.qty;

            const incBtn = makeIconButton('qty-btn', 'Increase quantity', '+');
            incBtn.addEventListener('click', () => {
                setQty(item.id, item.qty + 1);
                refresh();
            });

            const qtyControls = document.createElement('div');
            qtyControls.className = 'qty-controls';
            qtyControls.append(decBtn, qtyValue, incBtn);

            const lineTotal = document.createElement('div');
            lineTotal.className = 'cart-item-total';
            lineTotal.textContent = formatPrice(product.price * item.qty);

            const removeBtn = makeIconButton('remove-btn', 'Remove ' + product.name, '✕');
            removeBtn.addEventListener('click', () => {
                removeFromCart(item.id);
                refresh();
            });

            row.append(qtyControls, lineTotal, removeBtn);
            container.appendChild(row);
        });

        if (totalEl) totalEl.textContent = formatPrice(total);
    }

    refresh();
}

/* ---------- Wishlist page rendering ---------- */

function renderWishlistPage() {
    const container = document.getElementById('wishlistItems');
    if (!container) return;

    function refresh() {
        const list = getWishlist();
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
            removeBtn.addEventListener('click', () => {
                removeFromWishlist(product.id);
                refresh();
            });

            row.append(addBtn, removeBtn);
            container.appendChild(row);
        });

        initAddToCartButtons(container);
    }

    refresh();
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    initAddToCartButtons();
    initWishlistButtons();
    renderCartPage();
    renderWishlistPage();
});
