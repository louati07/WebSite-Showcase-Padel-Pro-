/* PadelPro — Contact Page JS */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const successEl = document.getElementById('contact-success');
    const formCard = document.querySelector('.contact-form-card');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let valid = true;

        ['name', 'email', 'subject', 'message'].forEach(id => {
            const el = document.getElementById(id);
            const err = document.getElementById(id + '-error');
            if (!el.value.trim()) {
                el.classList.add('error'); if (err) { err.textContent = 'Required'; err.classList.add('visible'); } valid = false;
            } else { el.classList.remove('error'); if (err) err.classList.remove('visible'); }
        });

        const email = document.getElementById('email');
        if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            email.classList.add('error');
            const err = document.getElementById('email-error');
            if (err) { err.textContent = 'Invalid email'; err.classList.add('visible'); }
            valid = false;
        }

        const msg = document.getElementById('message');
        if (msg.value.trim().length < 10) {
            msg.classList.add('error');
            const err = document.getElementById('message-error');
            if (err) { err.textContent = 'Message too short (min 10 chars)'; err.classList.add('visible'); }
            valid = false;
        }

        if (!valid) return;

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Sending...';

        try {
            const res = await apiPost('contact.php', {
                name: document.getElementById('name').value.trim(),
                email: email.value.trim(),
                subject: document.getElementById('subject').value.trim(),
                message: msg.value.trim()
            });
            form.style.display = 'none';
            successEl.classList.add('visible');
        } catch (err) {
            showToast(err.message || 'Failed to send message', 'error');
            btn.disabled = false;
            btn.textContent = 'Send Message →';
        }
    });
});
