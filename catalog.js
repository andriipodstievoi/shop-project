// Amazon-style catalog grid for products.html: renders cards from the PRODUCTS
// catalog in cart.js and filters them by search text, category and sort order.
document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    // PRODUCTS is fetched from products.json by cart.js
    await loadCatalog();

    const searchInput = document.getElementById('catalogSearch');
    const searchForm = document.getElementById('catalogSearchForm');
    const sortSelect = document.getElementById('catalogSort');
    const categoryList = document.getElementById('categoryList');
    const resultsCount = document.getElementById('resultsCount');
    const activeQueryEl = document.getElementById('activeQuery');

    // A deep link like products.html?q=socks should arrive pre-filtered
    const params = new URLSearchParams(window.location.search);
    const state = {
        query: (params.get('q') || '').trim(),
        category: params.get('category') || 'All',
        sort: 'featured'
    };
    if (searchInput) searchInput.value = state.query;

    /* ----- Sidebar categories ----- */

    const categories = ['All', ...new Set(PRODUCTS.map((p) => p.category))];

    function renderCategories() {
        categoryList.innerHTML = '';
        categories.forEach((category) => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'category-btn' + (category === state.category ? ' active' : '');
            btn.textContent = category;
            btn.addEventListener('click', () => {
                state.category = category;
                renderCategories();
                render();
            });
            li.appendChild(btn);
            categoryList.appendChild(li);
        });
    }

    /* ----- Star rating ----- */

    function buildStars(rating) {
        const wrap = document.createElement('span');
        wrap.className = 'stars';
        wrap.setAttribute('aria-label', rating.toFixed(1) + ' out of 5 stars');
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'star' + (i <= Math.round(rating) ? ' filled' : '');
            star.textContent = '★';
            star.setAttribute('aria-hidden', 'true');
            wrap.appendChild(star);
        }
        return wrap;
    }

    /* ----- Product card ----- */

    function createCard(product) {
        const card = document.createElement('article');
        card.className = 'product-card';

        const media = document.createElement('div');
        media.className = 'card-media';
        fillProductMedia(media, product);
        media.addEventListener('click', () => goToProduct(product.id));

        const heart = document.createElement('button');
        heart.type = 'button';
        heart.className = 'wishlist-btn card-wishlist';
        heart.dataset.id = product.id;
        heart.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.35-9.5-8.5C1 8 2.5 4.5 6 4.5c2 0 3.5 1.2 4.5 2.8 1-1.6 2.5-2.8 4.5-2.8 3.5 0 5 3.5 3.5 7-2.5 4.15-9.5 8.5-9.5 8.5z"/></svg>';
        media.appendChild(heart);

        const title = document.createElement('button');
        title.type = 'button';
        title.className = 'card-title';
        title.textContent = product.name;
        title.addEventListener('click', () => goToProduct(product.id));

        const ratingRow = document.createElement('div');
        ratingRow.className = 'card-rating';
        const reviewCount = document.createElement('span');
        reviewCount.className = 'review-count';
        reviewCount.textContent = product.reviews.toLocaleString('en-US');
        ratingRow.append(buildStars(product.rating), reviewCount);

        const price = document.createElement('div');
        price.className = 'card-price';
        price.textContent = formatPrice(product.price);

        const category = document.createElement('div');
        category.className = 'card-category';
        category.textContent = product.category;

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.dataset.id = product.id;

        const stock = Number(product.stock);
        const inStock = stock > 0;

        // The exact count is always visible, with a warning tone when it runs low
        const stockLine = document.createElement('div');
        stockLine.className = 'stock-line' + (inStock ? (stock <= 5 ? ' stock-low' : '') : ' stock-none');
        stockLine.textContent = inStock ? 'In stock: ' + stock : 'Out of stock';

        if (inStock) {
            addBtn.className = 'btn btn-buy add-cart-btn';
            addBtn.textContent = 'Add to cart';
        } else {
            // Not wired as an add-cart-btn at all, so it cannot be clicked
            addBtn.className = 'btn btn-disabled';
            addBtn.textContent = 'Out of stock';
            addBtn.disabled = true;

            const flag = document.createElement('div');
            flag.className = 'stock-flag';
            flag.textContent = 'Out of stock';
            media.appendChild(flag);
        }

        card.append(media, title, ratingRow, price, category, stockLine, addBtn);
        return card;
    }

    /* ----- Filtering ----- */

    function matches(product) {
        if (state.category !== 'All' && product.category !== state.category) return false;
        if (!state.query) return true;
        const haystack = (product.name + ' ' + product.category + ' ' + product.blurb).toLowerCase();
        // every word must appear somewhere, so "wool socks" and "socks wool" both work
        return state.query.toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
    }

    function sortProducts(list) {
        const sorted = [...list];
        if (state.sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
        if (state.sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
        if (state.sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
        return sorted;
    }

    function render() {
        const results = sortProducts(PRODUCTS.filter(matches));
        grid.innerHTML = '';

        resultsCount.textContent = results.length === 0
            ? 'No results'
            : '1-' + results.length + ' of ' + results.length + ' result' + (results.length === 1 ? '' : 's');

        activeQueryEl.textContent = state.query ? '"' + state.query + '"' : '';

        if (results.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'catalog-empty';

            const heading = document.createElement('p');
            heading.className = 'catalog-empty-title';
            heading.textContent = 'No results for "' + state.query + '"';

            const hint = document.createElement('p');
            hint.textContent = 'Try a different search term or browse another category.';

            const reset = document.createElement('button');
            reset.type = 'button';
            reset.className = 'btn btn-outline';
            reset.textContent = 'Clear filters';
            reset.addEventListener('click', () => {
                state.query = '';
                state.category = 'All';
                if (searchInput) searchInput.value = '';
                renderCategories();
                render();
            });

            empty.append(heading, hint, reset);
            grid.appendChild(empty);
            return;
        }

        results.forEach((product) => grid.appendChild(createCard(product)));

        // Cards are rebuilt on every filter, so their buttons are wired here
        initAddToCartButtons(grid);
        initWishlistButtons(grid);
    }

    /* ----- Wiring ----- */

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            state.query = searchInput.value.trim();
            render();
        });
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            state.query = searchInput.value.trim();
            render();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            state.sort = sortSelect.value;
            render();
        });
    }

    renderCategories();
    render();
});
