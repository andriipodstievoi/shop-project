// Product page: media on the left, actions and tabs on the right, details and
// description below, then a "similar products" strip and a "recently viewed"
// strip built from this browser's own history.
//
// Loaded by empty.html after auth.js and cart.js.

const RECENT_KEY = 'shop_recent';
const RECENT_MAX = 12;

/* ---------------- recently viewed (this browser only) ---------------- */

function readRecent() {
    try {
        const list = JSON.parse(localStorage.getItem(RECENT_KEY));
        return Array.isArray(list) ? list.filter((id) => typeof id === 'string') : [];
    } catch {
        return [];
    }
}

// Returns the history as it was *before* this visit, so the strip does not
// simply show the product the visitor is already looking at.
function recordRecent(productId) {
    const previous = readRecent().filter((id) => id !== productId);
    const updated = [productId, ...previous].slice(0, RECENT_MAX);
    try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
        // A full or blocked storage must not break the page
    }
    return previous;
}

/* ---------------- small building blocks ---------------- */

function buildStars(rating, extraClass) {
    const wrap = document.createElement('span');
    wrap.className = 'stars' + (extraClass ? ' ' + extraClass : '');
    wrap.setAttribute('aria-label', Number(rating).toFixed(1) + ' out of 5 stars');
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star' + (i <= Math.round(rating) ? ' filled' : '');
        star.textContent = '★';
        star.setAttribute('aria-hidden', 'true');
        wrap.appendChild(star);
    }
    return wrap;
}

function detailRow(label, value) {
    const row = document.createElement('div');
    row.className = 'detail-row';
    const l = document.createElement('span');
    l.className = 'detail-label';
    l.textContent = label;
    const v = document.createElement('span');
    v.className = 'detail-value';
    v.textContent = value;
    row.append(l, v);
    return row;
}

/* ---------------- media gallery ---------------- */

// Renders one gallery item into the main stage. Every branch keeps the item
// inside the fixed square, so a portrait photo from an unknown URL cannot
// stretch the column and push the text out of view.
function renderStage(stage, item, product) {
    stage.innerHTML = '';

    if (!item) {
        fillProductMedia(stage, product);
        return;
    }

    if (item.type === 'youtube') {
        const frame = document.createElement('iframe');
        frame.className = 'stage-embed';
        frame.src = 'https://www.youtube.com/embed/' + encodeURIComponent(item.url);
        frame.title = product.name + ' video';
        frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture';
        frame.allowFullscreen = true;
        frame.loading = 'lazy';
        stage.appendChild(frame);
        return;
    }

    if (item.type === 'video') {
        const video = document.createElement('video');
        video.className = 'stage-video';
        video.src = item.url;
        video.controls = true;
        video.preload = 'metadata';
        stage.appendChild(video);
        return;
    }

    const img = document.createElement('img');
    img.className = 'stage-image';
    img.src = item.url;
    img.alt = product.name;
    img.addEventListener('error', () => {
        // A dead link falls back to the drawn illustration
        fillProductMedia(stage, product);
    });
    stage.appendChild(img);
}

function buildGallery(product) {
    const wrap = document.createElement('div');
    wrap.className = 'gallery';

    const stage = document.createElement('div');
    stage.className = 'gallery-stage';

    const items = product.media || [];
    renderStage(stage, items[0] || null, product);
    wrap.appendChild(stage);

    // A single item needs no thumbnails
    if (items.length < 2) {
        return wrap;
    }

    const thumbs = document.createElement('div');
    thumbs.className = 'gallery-thumbs';

    items.forEach((item, index) => {
        const thumb = document.createElement('button');
        thumb.type = 'button';
        thumb.className = 'gallery-thumb' + (index === 0 ? ' active' : '');
        thumb.setAttribute('aria-label', 'View item ' + (index + 1));

        if (item.type === 'image') {
            const img = document.createElement('img');
            img.src = item.url;
            img.alt = '';
            img.loading = 'lazy';
            thumb.appendChild(img);
        } else {
            // Video thumbnails are a play glyph rather than a frame grab: the
            // YouTube still would need another request and a direct .mp4 has
            // no thumbnail at all
            const play = document.createElement('span');
            play.className = 'thumb-play';
            play.textContent = '▶';
            thumb.appendChild(play);
        }

        thumb.addEventListener('click', () => {
            renderStage(stage, item, product);
            thumbs.querySelectorAll('.gallery-thumb').forEach((t) => t.classList.remove('active'));
            thumb.classList.add('active');
        });

        thumbs.appendChild(thumb);
    });

    wrap.appendChild(thumbs);
    return wrap;
}

/* ---------------- horizontal product strip ---------------- */

function buildStrip(products, heading) {
    if (!products.length) return null;

    const section = document.createElement('section');
    section.className = 'strip';

    const head = document.createElement('div');
    head.className = 'strip-head';
    const title = document.createElement('h2');
    title.textContent = heading;

    const nav = document.createElement('div');
    nav.className = 'strip-nav';
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'strip-btn';
    prev.setAttribute('aria-label', 'Scroll left');
    prev.textContent = '‹';
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'strip-btn';
    next.setAttribute('aria-label', 'Scroll right');
    next.textContent = '›';
    nav.append(prev, next);
    head.append(title, nav);

    const track = document.createElement('div');
    track.className = 'strip-track';

    products.forEach((p) => {
        const card = document.createElement('article');
        card.className = 'strip-card';

        const media = document.createElement('div');
        media.className = 'strip-media';
        fillProductMedia(media, p);

        const name = document.createElement('button');
        name.type = 'button';
        name.className = 'strip-name';
        name.textContent = p.name;

        const price = document.createElement('div');
        price.className = 'strip-price';
        price.textContent = formatPrice(p.price);

        [media, name].forEach((el) => {
            el.addEventListener('click', () => goToProduct(p.id));
        });

        card.append(media, name, price);

        if (Number(p.stock) === 0) {
            const out = document.createElement('div');
            out.className = 'strip-out';
            out.textContent = 'Out of stock';
            card.appendChild(out);
        }

        track.appendChild(card);
    });

    // One click moves by roughly one card width, whatever the viewport
    const step = () => Math.max(200, Math.round(track.clientWidth * 0.8));
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

    function syncNav() {
        const atStart = track.scrollLeft <= 2;
        const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
        prev.disabled = atStart;
        next.disabled = atEnd;
        // Arrows are pointless when everything already fits
        nav.hidden = atStart && atEnd;
    }
    track.addEventListener('scroll', syncNav);
    window.addEventListener('resize', syncNav);

    section.append(head, track);
    // Measured after layout, otherwise clientWidth is still zero
    requestAnimationFrame(syncNav);
    return section;
}

/* ---------------- reviews ---------------- */

async function renderReviews(product, panel) {
    // Content goes in its own container: clearing the whole panel would take
    // the "Reviews" heading with it on every refresh.
    let body = panel.querySelector('.reviews-body');
    if (!body) {
        body = document.createElement('div');
        body.className = 'reviews-body';
        panel.appendChild(body);
    }
    body.innerHTML = '';

    let data;
    try {
        data = await Auth.get('api/reviews.php?product_id=' + encodeURIComponent(product.id));
    } catch (err) {
        const msg = document.createElement('p');
        msg.className = 'form-error';
        msg.textContent = err.message;
        body.appendChild(msg);
        return;
    }

    const summary = document.createElement('div');
    summary.className = 'reviews-summary';
    if (data.summary.total > 0) {
        summary.append(buildStars(data.summary.average, 'stars-lg'));
        const text = document.createElement('span');
        text.textContent = data.summary.average + ' out of 5 · ' + data.summary.total +
            (data.summary.total === 1 ? ' review' : ' reviews');
        summary.appendChild(text);
    } else {
        const text = document.createElement('span');
        text.textContent = 'No reviews yet. Be the first to write one.';
        summary.appendChild(text);
    }
    body.appendChild(summary);

    // Write / edit form
    if (data.can_review) {
        const form = document.createElement('form');
        form.className = 'review-form';

        const heading = document.createElement('h3');
        heading.textContent = data.mine ? 'Edit your review' : 'Write a review';

        const ratingField = document.createElement('div');
        ratingField.className = 'form-field';
        const ratingLabel = document.createElement('label');
        ratingLabel.textContent = 'Rating';
        const select = document.createElement('select');
        [5, 4, 3, 2, 1].forEach((n) => {
            const opt = document.createElement('option');
            opt.value = String(n);
            opt.textContent = n + (n === 1 ? ' star' : ' stars');
            if (data.mine && data.mine.rating === n) opt.selected = true;
            select.appendChild(opt);
        });
        ratingField.append(ratingLabel, select);

        const textField = document.createElement('div');
        textField.className = 'form-field';
        const textLabel = document.createElement('label');
        textLabel.textContent = 'Your review';
        const textarea = document.createElement('textarea');
        textarea.rows = 4;
        textarea.required = true;
        if (data.mine) textarea.value = data.mine.body;
        textField.append(textLabel, textarea);

        const error = document.createElement('p');
        error.className = 'form-error';

        const actions = document.createElement('div');
        actions.className = 'profile-actions';
        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.className = 'btn btn-buy';
        submit.textContent = data.mine ? 'Update review' : 'Submit review';
        actions.appendChild(submit);

        if (data.mine) {
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'btn btn-outline';
            del.textContent = 'Delete';
            del.addEventListener('click', async () => {
                del.disabled = true;
                try {
                    await Auth.post('api/reviews.php', { action: 'delete', review_id: data.mine.id });
                    await renderReviews(product, panel);
                } catch (err) {
                    error.textContent = err.message;
                    del.disabled = false;
                }
            });
            actions.appendChild(del);
        }

        form.append(heading, ratingField, textField, error, actions);
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            error.textContent = '';
            submit.disabled = true;
            try {
                await Auth.post('api/reviews.php', {
                    action: 'save',
                    product_id: product.id,
                    rating: Number(select.value),
                    body: textarea.value.trim()
                });
                await renderReviews(product, panel);
            } catch (err) {
                error.textContent = err.message;
                submit.disabled = false;
            }
        });
        body.appendChild(form);
    } else {
        const prompt = document.createElement('p');
        prompt.className = 'review-signin';
        const link = document.createElement('a');
        link.href = 'login.html';
        link.textContent = 'Sign in';
        prompt.append(link, document.createTextNode(' to leave a review.'));
        body.appendChild(prompt);
    }

    // Existing reviews
    const list = document.createElement('div');
    list.className = 'review-list';
    data.reviews.forEach((r) => {
        const card = document.createElement('article');
        card.className = 'review-card';

        const head = document.createElement('div');
        head.className = 'review-head';
        const who = document.createElement('span');
        who.className = 'review-author';
        who.textContent = r.author_name + (r.is_mine ? ' (you)' : '');
        const when = document.createElement('span');
        when.className = 'review-date';
        when.textContent = formatOrderDate(r.created_at, true);
        head.append(buildStars(r.rating), who, when);

        const body = document.createElement('p');
        body.className = 'review-body';
        body.textContent = r.body;

        card.append(head, body);

        // Admins moderate other people's reviews from the product page itself
        if (!r.is_mine && Auth.isAdmin()) {
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'link-btn';
            del.textContent = 'Delete (admin)';
            del.addEventListener('click', async () => {
                del.disabled = true;
                try {
                    await Auth.post('api/reviews.php', { action: 'delete', review_id: r.id });
                    await renderReviews(product, panel);
                } catch (err) {
                    console.error(err);
                    del.disabled = false;
                }
            });
            card.appendChild(del);
        }

        list.appendChild(card);
    });
    body.appendChild(list);
}

/* ---------------- page assembly ---------------- */

document.addEventListener('DOMContentLoaded', async () => {
    const root = document.getElementById('productPage');
    if (!root) return;

    await loadCatalog();
    await Auth.load();

    const params = new URLSearchParams(window.location.search);
    let product = getProduct(params.get('id'));

    // Older links used ?product=<name>
    if (!product && params.get('product')) {
        const name = params.get('product');
        product = PRODUCTS.find((p) => p.name === name) || null;
    }

    if (!product) {
        document.title = 'Product not found';
        const box = document.createElement('div');
        box.className = 'profile-card product-missing';
        const h = document.createElement('h1');
        h.textContent = 'Product not found';
        const p = document.createElement('p');
        p.textContent = 'That product does not exist or is no longer available.';
        const a = document.createElement('a');
        a.href = 'products.html';
        a.className = 'btn btn-outline';
        a.textContent = 'Back to shop';
        box.append(h, p, a);
        root.appendChild(box);
        return;
    }

    document.title = product.name;
    const previouslyViewed = recordRecent(product.id);

    /* ---- top: media left, actions and tabs right ---- */

    const top = document.createElement('div');
    top.className = 'product-top';

    const mediaCol = document.createElement('div');
    mediaCol.className = 'product-media';
    mediaCol.appendChild(buildGallery(product));

    const infoCol = document.createElement('div');
    infoCol.className = 'product-info';

    const category = document.createElement('div');
    category.className = 'product-category';
    category.textContent = product.category;

    const heading = document.createElement('h1');
    heading.textContent = product.name;

    const ratingRow = document.createElement('div');
    ratingRow.className = 'product-rating';
    ratingRow.appendChild(buildStars(product.rating));
    const ratingText = document.createElement('button');
    ratingText.type = 'button';
    ratingText.className = 'link-btn';
    ratingText.textContent = product.reviews + (product.reviews === 1 ? ' review' : ' reviews');
    ratingRow.appendChild(ratingText);

    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = formatPrice(product.price);

    const stock = Number(product.stock);
    const inStock = stock > 0;
    const stockLine = document.createElement('div');
    stockLine.className = 'stock-line' + (inStock ? (stock <= 5 ? ' stock-low' : '') : ' stock-none');
    stockLine.textContent = inStock ? 'In stock: ' + stock + ' available' : 'Out of stock';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.dataset.id = product.id;
    if (inStock) {
        addBtn.className = 'btn btn-buy add-cart-btn';
        addBtn.textContent = 'Add to cart';
    } else {
        addBtn.className = 'btn btn-disabled';
        addBtn.textContent = 'Out of stock';
        addBtn.disabled = true;
    }

    const wishBtn = document.createElement('button');
    wishBtn.type = 'button';
    wishBtn.className = 'wishlist-btn';
    wishBtn.dataset.id = product.id;
    wishBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.35-9.5-8.5C1 8 2.5 4.5 6 4.5c2 0 3.5 1.2 4.5 2.8 1-1.6 2.5-2.8 4.5-2.8 3.5 0 5 3.5 3.5 7-2.5 4.15-9.5 8.5-9.5 8.5z"/></svg>';

    // Price, availability and the actions live in one bordered block, so the
    // buying decision is visually separate from the reading material below.
    const buyBox = document.createElement('div');
    buyBox.className = 'buy-box';

    const actions = document.createElement('div');
    actions.className = 'product-actions';
    actions.append(addBtn, wishBtn);

    buyBox.append(price, stockLine, actions);

    /* ---- tab buttons, level with the top of the photo ---- */

    const tabBar = document.createElement('div');
    tabBar.className = 'product-tabs';

    const tabs = [
        { key: 'description', label: 'Description' },
        { key: 'specs', label: 'Specifications' },
        { key: 'reviews', label: 'Reviews' }
    ];

    const panels = {};
    const tabButtons = {};

    let reviewsLoaded = false;
    function selectTab(key) {
        Object.keys(panels).forEach((k) => {
            panels[k].hidden = k !== key;
            tabButtons[k].classList.toggle('active', k === key);
            tabButtons[k].setAttribute('aria-selected', String(k === key));
        });
        // Reviews are fetched the first time they are actually opened
        if (key === 'reviews' && !reviewsLoaded) {
            reviewsLoaded = true;
            renderReviews(product, panels.reviews);
        }
        panelsWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    tabs.forEach((t) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'product-tab';
        btn.textContent = t.label;
        btn.setAttribute('role', 'tab');
        btn.addEventListener('click', () => selectTab(t.key));
        tabButtons[t.key] = btn;
        tabBar.appendChild(btn);
    });

    /* ---- details block, under the tab buttons ---- */

    const details = document.createElement('div');
    details.className = 'product-details';
    const detailsTitle = document.createElement('h2');
    detailsTitle.textContent = 'Product details';
    details.appendChild(detailsTitle);

    const rows = document.createElement('div');
    rows.className = 'detail-rows';
    rows.appendChild(detailRow('Availability', inStock ? stock + ' in stock' : 'Out of stock'));
    if (product.material) rows.appendChild(detailRow('Material', product.material));
    if (product.origin) rows.appendChild(detailRow('Made in', product.origin));
    if (product.weight) rows.appendChild(detailRow('Weight', product.weight));
    if (product.sku) rows.appendChild(detailRow('SKU', product.sku));
    rows.appendChild(detailRow('Category', product.category));
    details.appendChild(rows);

    // Category and title on the left, rating pushed to the right edge on the
    // same line, so the top of the column reads as one balanced row.
    const titleBlock = document.createElement('div');
    titleBlock.className = 'product-title-block';
    titleBlock.append(category, heading);

    const headerRow = document.createElement('div');
    headerRow.className = 'product-header';
    headerRow.append(titleBlock, ratingRow);

    infoCol.append(headerRow, buyBox, tabBar, details);
    top.append(mediaCol, infoCol);

    /* ---- tab panels, full width under the two columns ---- */

    const panelsWrap = document.createElement('div');
    panelsWrap.className = 'product-panels';

    const descPanel = document.createElement('section');
    descPanel.className = 'product-panel';
    const descTitle = document.createElement('h2');
    descTitle.textContent = 'Description';
    const descText = document.createElement('p');
    descText.className = 'product-blurb';
    descText.textContent = product.blurb || 'No description yet.';
    descPanel.append(descTitle, descText);
    if (product.care) {
        const careTitle = document.createElement('h3');
        careTitle.textContent = 'Care';
        const careText = document.createElement('p');
        careText.className = 'product-blurb';
        careText.textContent = product.care;
        descPanel.append(careTitle, careText);
    }
    panels.description = descPanel;

    const specsPanel = document.createElement('section');
    specsPanel.className = 'product-panel';
    const specsTitle = document.createElement('h2');
    specsTitle.textContent = 'Specifications';
    specsPanel.appendChild(specsTitle);

    const specTable = document.createElement('div');
    specTable.className = 'detail-rows';
    if (product.material) specTable.appendChild(detailRow('Material', product.material));
    if (product.origin) specTable.appendChild(detailRow('Country of origin', product.origin));
    if (product.weight) specTable.appendChild(detailRow('Weight', product.weight));
    if (product.sku) specTable.appendChild(detailRow('SKU', product.sku));
    (product.specs || []).forEach((s) => specTable.appendChild(detailRow(s.label, s.value)));
    if (!specTable.children.length) {
        const none = document.createElement('p');
        none.textContent = 'No specifications listed yet.';
        specsPanel.appendChild(none);
    } else {
        specsPanel.appendChild(specTable);
    }
    panels.specs = specsPanel;

    const reviewsPanel = document.createElement('section');
    reviewsPanel.className = 'product-panel';
    const reviewsTitle = document.createElement('h2');
    reviewsTitle.textContent = 'Reviews';
    reviewsPanel.appendChild(reviewsTitle);
    panels.reviews = reviewsPanel;

    Object.values(panels).forEach((p) => panelsWrap.appendChild(p));

    root.append(top, panelsWrap);

    // The review count next to the stars jumps straight to the reviews tab
    ratingText.addEventListener('click', () => selectTab('reviews'));

    selectTab('description');

    /* ---- strips below everything ---- */

    const similar = PRODUCTS
        .filter((p) => p.id !== product.id && p.category === product.category)
        .slice(0, 12);

    // Fall back to anything else when the category has nothing to show
    const filler = PRODUCTS.filter((p) => p.id !== product.id && p.category !== product.category);
    const similarList = similar.length ? similar : filler.slice(0, 12);

    const similarStrip = buildStrip(
        similarList,
        similar.length ? 'More in ' + product.category : 'You might also like'
    );
    if (similarStrip) root.appendChild(similarStrip);

    // History strip only when this browser has actually seen other products
    const recentList = previouslyViewed
        .map((id) => getProduct(id))
        .filter((p) => p && p.id !== product.id);

    const recentStrip = buildStrip(recentList, 'Recently viewed');
    if (recentStrip) root.appendChild(recentStrip);

    // Buttons created above are wired here, after they are in the document
    initAddToCartButtons(root);
    await initWishlistButtons(root);
});
