// Shared order rendering for orders.html and admin.html.
// Order text comes from the database, so it is set with textContent only.

const ORDER_STATUSES = ['new', 'processing', 'shipped', 'completed', 'cancelled'];

function formatOrderDate(value, dateOnly) {
    // MySQL returns "YYYY-MM-DD HH:MM:SS"; Safari refuses that with a space
    const date = new Date(String(value).replace(' ', 'T'));
    if (isNaN(date)) return String(value);
    return dateOnly ? date.toLocaleDateString() : date.toLocaleString();
}

function buildDeliveryLine(order) {
    const wrap = document.createElement('div');
    wrap.className = 'order-delivery';

    const where = [order.address, order.city, order.postal_code, order.country]
        .filter(Boolean)
        .join(', ');

    const addr = document.createElement('div');
    addr.textContent = where || order.address || '';
    wrap.appendChild(addr);

    if (order.delivery_method) {
        const method = document.createElement('div');
        const cost = Number(order.shipping_cost) === 0 ? 'free' : formatPrice(Number(order.shipping_cost));
        method.textContent = order.delivery_method + ' · ' + cost;
        wrap.appendChild(method);
    }

    // Only meaningful while the order is still on its way
    if (order.eta_from && order.eta_to && order.status !== 'cancelled' && order.status !== 'completed') {
        const eta = document.createElement('div');
        eta.className = 'order-eta';
        eta.textContent = 'Expected ' + formatOrderDate(order.eta_from, true) +
            ' – ' + formatOrderDate(order.eta_to, true);
        wrap.appendChild(eta);
    }

    return wrap;
}

function buildStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = 'status-badge status-' + status;
    badge.textContent = status;
    return badge;
}

function buildOrderCard(order, options = {}) {
    const card = document.createElement('section');
    card.className = 'order-card';

    const head = document.createElement('div');
    head.className = 'order-head';

    const title = document.createElement('div');
    const number = document.createElement('span');
    number.className = 'order-number';
    number.textContent = 'Order #' + order.id;
    const date = document.createElement('span');
    date.className = 'order-date';
    date.textContent = formatOrderDate(order.created_at);
    title.append(number, date);

    head.append(title, buildStatusBadge(order.status));
    card.appendChild(head);

    // Admin view also shows who ordered it
    if (options.showCustomer) {
        const customer = document.createElement('p');
        customer.className = 'order-customer';
        customer.textContent = order.contact_name + ' · ' + order.contact_email +
            (order.contact_phone ? ' · ' + order.contact_phone : '');
        card.appendChild(customer);

    }

    card.appendChild(buildDeliveryLine(order));

    const lines = document.createElement('ul');
    lines.className = 'order-lines';
    (order.items || []).forEach((item) => {
        const li = document.createElement('li');

        const name = document.createElement('span');
        name.textContent = item.product_name;

        const qty = document.createElement('span');
        qty.className = 'order-line-qty';
        // Historical price, copied in at checkout
        qty.textContent = '×' + item.qty + '  ' + formatPrice(item.unit_price);

        const lineTotal = document.createElement('span');
        lineTotal.className = 'order-line-total';
        lineTotal.textContent = formatPrice(item.unit_price * item.qty);

        li.append(name, qty, lineTotal);
        lines.appendChild(li);
    });
    card.appendChild(lines);

    const foot = document.createElement('div');
    foot.className = 'order-foot';

    const total = document.createElement('span');
    total.className = 'order-total';
    total.textContent = 'Total ' + formatPrice(order.total);
    foot.appendChild(total);

    // Customers may pull back an order the shop has not started handling yet
    if (options.onCancel && order.status === 'new') {
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'btn btn-outline';
        cancel.textContent = 'Cancel order';
        cancel.addEventListener('click', async () => {
            cancel.disabled = true;
            try {
                await options.onCancel(order.id);
            } catch (err) {
                console.error(err);
                cancel.disabled = false;
            }
        });
        foot.appendChild(cancel);
    }

    // Admins can move an order along
    if (options.onStatusChange) {
        const select = document.createElement('select');
        select.className = 'status-select';
        ORDER_STATUSES.forEach((status) => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            if (status === order.status) option.selected = true;
            select.appendChild(option);
        });
        select.addEventListener('change', async () => {
            select.disabled = true;
            try {
                await options.onStatusChange(order.id, select.value);
                head.replaceChild(buildStatusBadge(select.value), head.lastChild);
            } catch (err) {
                console.error(err);
                select.value = order.status;
            }
            select.disabled = false;
        });
        foot.appendChild(select);
    }

    card.appendChild(foot);
    return card;
}
