/* PadelPro — API Communication Layer */
const API_BASE = './api';

async function apiGet(endpoint, params = {}) {
    let url = API_BASE + '/' + endpoint;
    const qs = new URLSearchParams(params).toString();
    if (qs) url += '?' + qs;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
    } catch (err) {
        console.error(`API GET ${endpoint}:`, err);
        throw err;
    }
}

async function apiPost(endpoint, body = {}) {
    const url = API_BASE + '/' + endpoint;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
    } catch (err) {
        console.error(`API POST ${endpoint}:`, err);
        throw err;
    }
}

function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: '✓', error: '✕', warning: '!' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}