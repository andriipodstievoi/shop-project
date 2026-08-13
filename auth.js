// Thin wrapper around the PHP API in /api.
// Every page loads this; it caches the signed-in user and the CSRF token.
const Auth = (() => {
    let currentUser = null;
    let csrf = '';
    let loaded = null;

    async function request(url, options = {}) {
        const res = await fetch(url, {
            credentials: 'same-origin',
            ...options
        });

        let data = {};
        try {
            data = await res.json();
        } catch {
            // A PHP fatal error or a static host returning the raw file lands here
            throw new Error('Server did not return valid data. Is the site running through PHP (XAMPP)?');
        }

        if (!res.ok) {
            throw new Error(data.error || 'Request failed');
        }
        return data;
    }

    function post(url, body) {
        return request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrf
            },
            body: JSON.stringify(body || {})
        });
    }

    // Resolves once per page load; other calls reuse the same promise.
    function load() {
        if (!loaded) {
            loaded = request('api/me.php')
                .then((data) => {
                    currentUser = data.user;
                    csrf = data.csrf;
                    return currentUser;
                })
                .catch((err) => {
                    // Signed-out browsing still works if the backend is missing
                    console.warn('Auth unavailable:', err.message);
                    currentUser = null;
                    return null;
                });
        }
        return loaded;
    }

    return {
        load,
        user: () => currentUser,
        isLoggedIn: () => currentUser !== null,
        isAdmin: () => currentUser !== null && currentUser.role === 'admin',

        async register(details) {
            await load();
            const data = await post('api/register.php', details);
            currentUser = data.user;
            csrf = data.csrf;
            return currentUser;
        },

        async login(email, password) {
            await load();
            const data = await post('api/login.php', { email, password });
            currentUser = data.user;
            csrf = data.csrf;
            return currentUser;
        },

        async logout() {
            await post('api/logout.php');
            currentUser = null;
            loaded = null;
        },

        async saveProfile(name, phone) {
            const data = await post('api/me.php', { name, phone });
            currentUser = data.user;
            return currentUser;
        }
    };
})();

// Reflects sign-in state in the header of every page.
document.addEventListener('DOMContentLoaded', async () => {
    await Auth.load();
    const label = document.getElementById('accountLabel');
    if (label) {
        const user = Auth.user();
        label.textContent = user ? (user.name || user.email) : 'Sign in';
    }
});
