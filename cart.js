// Shared cart/wishlist/profile storage + UI wiring, used by every page.
// State persists in localStorage so it survives navigation between pages.
const CART_KEY = 'shop_cart';
const WISHLIST_KEY = 'shop_wishlist';
const PROFILE_KEY = 'shop_profile';

const PRODUCT_ICONS = {
    'Nebula Hoodie': {
        color: '#6d28d9',
        bg: 'radial-gradient(circle, #ede9fe, #c4b5fd)',
        svg: '<path fill="currentColor" d="M30 26 Q50 6 70 26 L70 34 Q50 24 30 34 Z"/><rect x="30" y="30" width="40" height="55" rx="10" fill="currentColor"/><rect x="10" y="34" width="18" height="34" rx="8" fill="currentColor" transform="rotate(-15 19 51)"/><rect x="72" y="34" width="18" height="34" rx="8" fill="currentColor" transform="rotate(15 81 51)"/><rect x="40" y="60" width="20" height="14" rx="4" fill="rgba(0,0,0,0.15)"/><circle cx="45" cy="34" r="2" fill="rgba(0,0,0,0.25)"/><circle cx="55" cy="34" r="2" fill="rgba(0,0,0,0.25)"/>'
    },
    'Solstice Sneakers': {
        color: '#c2410c',
        bg: 'radial-gradient(circle, #ffedd5, #fdba74)',
        svg: '<path fill="currentColor" d="M12 66 Q12 54 24 52 L50 44 Q62 40 72 46 L86 54 Q92 57 92 64 L92 70 Q92 74 88 74 L18 74 Q12 74 12 68 Z"/><rect x="12" y="70" width="80" height="8" rx="4" fill="rgba(0,0,0,0.2)"/><path fill="rgba(0,0,0,0.15)" d="M24 52 L50 44 Q54 50 50 56 L28 62 Z"/>'
    },
    'Aurora Backpack': {
        color: '#0f766e',
        bg: 'radial-gradient(circle, #ccfbf1, #5eead4)',
        svg: '<rect x="28" y="26" width="44" height="58" rx="16" fill="currentColor"/><path d="M38 26 Q38 12 50 12 Q62 12 62 26" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><rect x="36" y="38" width="28" height="18" rx="5" fill="rgba(0,0,0,0.18)"/><rect x="42" y="62" width="16" height="16" rx="4" fill="rgba(0,0,0,0.12)"/>'
    }
};

function goToProduct(name, price) {
    window.location.href = 'empty.html?product=' + encodeURIComponent(name) + '&price=' + encodeURIComponent(price);
}

// Builds the illustration + name/price part of a cart or wishlist row.
// Product names originate from the URL on empty.html, so they are treated as
// untrusted and set with textContent, never interpolated into innerHTML.
function buildItemMedia(item, priceLabel) {
    const icon = PRODUCT_ICONS[item.name];

    const illustration = document.createElement('div');
    illustration.className = 'cart-item-illustration';
    illustration.style.background = icon ? icon.bg : '#eee';
    illustration.style.color = icon ? icon.color : '#999';
    // icon.svg is our own static markup, looked up by exact name, never user input
    illustration.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + (icon ? icon.svg : '') + '</svg>';

    const info = document.createElement('div');
    info.className = 'cart-item-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'cart-item-name';
    nameEl.textContent = item.name;

    const priceEl = document.createElement('div');
    priceEl.className = 'cart-item-price';
    priceEl.textContent = priceLabel;

    info.append(nameEl, priceEl);

    [illustration, info].forEach((el) => {
        el.addEventListener('click', () => goToProduct(item.name, item.price));
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

/* ---------- Cart ---------- */

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(name, price) {
    const cart = getCart();
    const existing = cart.find((item) => item.name === name);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ name, price: parseFloat(price), qty: 1 });
    }
    saveCart(cart);
}

function removeFromCart(name) {
    saveCart(getCart().filter((item) => item.name !== name));
}

function setQty(name, qty) {
    if (qty <= 0) {
        removeFromCart(name);
        return;
    }
    const cart = getCart();
    const item = cart.find((i) => i.name === name);
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
        btn.addEventListener('click', () => {
            const { name, price } = btn.dataset;
            addToCart(name, price);
            const original = btn.innerHTML;
            btn.classList.add('added');
            btn.innerHTML = 'Added &#10003;';
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = original;
            }, 900);
        });
    });
}

/* ---------- Wishlist ---------- */

function getWishlist() {
    try {
        return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
    } catch {
        return [];
    }
}

function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

function isInWishlist(name) {
    return getWishlist().some((item) => item.name === name);
}

function toggleWishlist(name, price) {
    const list = getWishlist();
    const idx = list.findIndex((item) => item.name === name);
    if (idx > -1) {
        list.splice(idx, 1);
    } else {
        list.push({ name, price: parseFloat(price) });
    }
    saveWishlist(list);
    return idx === -1;
}

function removeFromWishlist(name) {
    saveWishlist(getWishlist().filter((item) => item.name !== name));
}

function initWishlistButtons(root = document) {
    root.querySelectorAll('.wishlist-btn').forEach((btn) => {
        const { name } = btn.dataset;
        btn.classList.toggle('active', isInWishlist(name));
        btn.addEventListener('click', () => {
            const nowIn = toggleWishlist(btn.dataset.name, btn.dataset.price);
            btn.classList.toggle('active', nowIn);
        });
    });
}

/* ---------- Profile ---------- */

function getProfile() {
    try {
        return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
    } catch {
        return {};
    }
}

function saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function initAccountPage() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    const profile = getProfile();
    document.getElementById('profileName').value = profile.name || '';
    document.getElementById('profileEmail').value = profile.email || '';
    document.getElementById('profilePhone').value = profile.phone || '';

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProfile({
            name: document.getElementById('profileName').value.trim(),
            email: document.getElementById('profileEmail').value.trim(),
            phone: document.getElementById('profilePhone').value.trim()
        });
        const confirmEl = document.getElementById('saveConfirm');
        confirmEl.classList.add('show');
        setTimeout(() => confirmEl.classList.remove('show'), 1500);
    });
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
            container.innerHTML = '<p class="cart-empty">Your cart is empty. <a href="products.html">Browse products</a></p>';
            if (summaryEl) summaryEl.style.display = 'none';
            if (continueEl) continueEl.style.display = 'none';
            return;
        }

        if (summaryEl) summaryEl.style.display = 'flex';
        if (continueEl) continueEl.style.display = 'block';

        let total = 0;

        cart.forEach((item) => {
            total += item.price * item.qty;

            const row = document.createElement('div');
            row.className = 'cart-item';
            row.appendChild(buildItemMedia(item, '$' + item.price.toFixed(2) + ' each'));

            const decBtn = makeIconButton('qty-btn', 'Decrease quantity', '−');
            decBtn.addEventListener('click', () => {
                setQty(item.name, item.qty - 1);
                refresh();
            });

            const qtyValue = document.createElement('span');
            qtyValue.className = 'qty-value';
            qtyValue.textContent = item.qty;

            const incBtn = makeIconButton('qty-btn', 'Increase quantity', '+');
            incBtn.addEventListener('click', () => {
                setQty(item.name, item.qty + 1);
                refresh();
            });

            const qtyControls = document.createElement('div');
            qtyControls.className = 'qty-controls';
            qtyControls.append(decBtn, qtyValue, incBtn);

            const lineTotal = document.createElement('div');
            lineTotal.className = 'cart-item-total';
            lineTotal.textContent = '$' + (item.price * item.qty).toFixed(2);

            const removeBtn = makeIconButton('remove-btn', 'Remove ' + item.name, '✕');
            removeBtn.addEventListener('click', () => {
                removeFromCart(item.name);
                refresh();
            });

            row.append(qtyControls, lineTotal, removeBtn);
            container.appendChild(row);
        });

        if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
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
            container.innerHTML = '<p class="cart-empty">Your wishlist is empty. <a href="products.html">Browse products</a></p>';
            return;
        }

        list.forEach((item) => {
            const row = document.createElement('div');
            row.className = 'cart-item';
            row.appendChild(buildItemMedia(item, '$' + item.price.toFixed(2)));

            // dataset assignment sets the attribute value directly, so a name
            // containing quotes or markup cannot break out of the attribute
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.className = 'btn btn-primary add-cart-btn';
            addBtn.dataset.name = item.name;
            addBtn.dataset.price = item.price;
            addBtn.textContent = 'Add to cart';

            const removeBtn = makeIconButton('remove-btn', 'Remove ' + item.name, '✕');
            removeBtn.addEventListener('click', () => {
                removeFromWishlist(item.name);
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
    initAccountPage();
    renderCartPage();
    renderWishlistPage();
});
