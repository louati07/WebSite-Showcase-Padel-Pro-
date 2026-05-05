/* PadelPro — Booking Page JS */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('booking-form');
    const courtSelect = document.getElementById('court_id');
    const dateInput = document.getElementById('booking_date');
    const startInput = document.getElementById('start_time');
    const endInput = document.getElementById('end_time');
    const promoInput = document.getElementById('promo_code');
    const promoStatus = document.getElementById('promo-status');
    const amountEl = document.getElementById('price-amount');
    const breakdownEl = document.getElementById('price-breakdown');
    const unitEl = document.getElementById('price-unit');
    const summaryEl = document.getElementById('booking-summary');
    const submitBtn = document.getElementById('submit-btn');

    let promoDiscount = 0;
    let promoValid = false;

    dateInput.min = new Date().toISOString().split('T')[0];

    /* Load courts from API */
    async function loadCourts() {
        try {
            const res = await apiGet('courts.php');
            const courts = res.data || [];
            courtSelect.innerHTML = '<option value="" disabled selected>Choose a court...</option>';
            courts.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.court_id;
                opt.dataset.rate = c.hourly_rate;
                opt.dataset.type = c.surface_type;
                opt.textContent = `${c.name} — ${c.surface_type} · ${c.hourly_rate} TND/h`;
                courtSelect.appendChild(opt);
            });
            const urlParams = new URLSearchParams(window.location.search);
            const preselect = urlParams.get('court');
            if (preselect) { courtSelect.value = preselect; updatePrice(); }
        } catch (e) {
            console.warn('API unavailable, using fallback courts');
            const fallback = [
                [1,'Court A','Indoor',60],[2,'Court B','Indoor',60],[3,'Court C','Outdoor',50],
                [4,'Court D','Outdoor',50],[5,'Court E','Panoramic',80],[6,'Court F','Panoramic',80],[7,'Court G','Indoor',70]
            ];
            courtSelect.innerHTML = '<option value="" disabled selected>Choose a court...</option>';
            fallback.forEach(([id,name,type,rate]) => {
                const opt = document.createElement('option');
                opt.value = id; opt.dataset.rate = rate; opt.dataset.type = type;
                opt.textContent = `${name} — ${type} · ${rate} TND/h`;
                courtSelect.appendChild(opt);
            });
        }
    }

    /* Price calculation — migrated from Flask inline script */
    function updatePrice() {
        const sel = courtSelect.options[courtSelect.selectedIndex];
        const rate = parseFloat(sel?.dataset?.rate);
        const courtName = sel?.text?.split(' —')[0];
        const start = startInput.value;
        const end = endInput.value;

        if (!rate || !start || !end || start >= end) {
            amountEl.textContent = '—';
            breakdownEl.textContent = (start && end && start >= end) ? '⚠ End time must be after start time' : 'Select a court and time';
            unitEl.textContent = '';
            hideSummary();
            return;
        }

        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const duration = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
        const base = duration * rate;
        const disc = base * (promoDiscount / 100);
        const total = (base - disc).toFixed(2);

        amountEl.textContent = `TND${total}`;
        breakdownEl.textContent = `${courtName} · ${duration.toFixed(1)}h × TND${rate}/h`;
        unitEl.textContent = promoDiscount ? `${promoDiscount}% promo applied` : 'before promo';
    }

    courtSelect.addEventListener('change', updatePrice);
    startInput.addEventListener('change', updatePrice);
    endInput.addEventListener('change', updatePrice);

    /* Promo code validation */
    let promoTimeout;
    if (promoInput) {
        promoInput.addEventListener('input', () => {
            clearTimeout(promoTimeout);
            promoTimeout = setTimeout(validatePromo, 600);
        });
    }

    async function validatePromo() {
        const code = promoInput.value.trim();
        const email = document.getElementById('email').value.trim();
        if (!code) { promoStatus.textContent = ''; promoDiscount = 0; promoValid = false; updatePrice(); return; }
        if (!email) { promoStatus.textContent = 'Enter your email first'; promoStatus.className = 'promo-status invalid'; return; }

        try {
            const res = await apiPost('promo.php', { code, email });
            if (res.valid) {
                promoDiscount = res.discount_percent;
                promoValid = true;
                promoStatus.textContent = `✓ ${res.message}`;
                promoStatus.className = 'promo-status valid';
            } else {
                promoDiscount = 0;
                promoValid = false;
                promoStatus.textContent = `✕ ${res.message}`;
                promoStatus.className = 'promo-status invalid';
            }
            updatePrice();
        } catch (e) {
            promoStatus.textContent = 'Could not verify promo code';
            promoStatus.className = 'promo-status invalid';
        }
    }

    /* Client-side validation */
    function validateForm() {
        let valid = true;
        const fields = ['first_name', 'last_name', 'email', 'phone', 'court_id', 'booking_date', 'start_time', 'end_time'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            const err = document.getElementById(id + '-error');
            if (!el.value.trim()) { el.classList.add('error'); if (err) { err.textContent = 'Required'; err.classList.add('visible'); } valid = false; }
            else { el.classList.remove('error'); if (err) err.classList.remove('visible'); }
        });

        const email = document.getElementById('email');
        if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            email.classList.add('error');
            const err = document.getElementById('email-error');
            if (err) { err.textContent = 'Invalid email format'; err.classList.add('visible'); }
            valid = false;
        }

        if (startInput.value && endInput.value && startInput.value >= endInput.value) {
            endInput.classList.add('error');
            const err = document.getElementById('end_time-error');
            if (err) { err.textContent = 'Must be after start time'; err.classList.add('visible'); }
            valid = false;
        }

        const date = dateInput.value;
        if (date && date < new Date().toISOString().split('T')[0]) {
            dateInput.classList.add('error');
            const err = document.getElementById('booking_date-error');
            if (err) { err.textContent = 'Cannot book in the past'; err.classList.add('visible'); }
            valid = false;
        }

        return valid;
    }

    /* Summary */
    function showSummary() {
        if (!summaryEl) return;
        const sel = courtSelect.options[courtSelect.selectedIndex];
        const rate = parseFloat(sel.dataset.rate);
        const [sh,sm] = startInput.value.split(':').map(Number);
        const [eh,em] = endInput.value.split(':').map(Number);
        const dur = ((eh*60+em)-(sh*60+sm))/60;
        const base = dur * rate;
        const disc = base * (promoDiscount/100);
        const total = (base-disc).toFixed(2);

        document.getElementById('s-name').textContent = document.getElementById('first_name').value + ' ' + document.getElementById('last_name').value;
        document.getElementById('s-email').textContent = document.getElementById('email').value;
        document.getElementById('s-court').textContent = sel.text.split(' —')[0];
        document.getElementById('s-date').textContent = dateInput.value;
        document.getElementById('s-time').textContent = startInput.value + ' → ' + endInput.value;
        document.getElementById('s-duration').textContent = dur.toFixed(1) + 'h';
        document.getElementById('s-total').textContent = 'TND ' + total;

        summaryEl.classList.add('visible');
    }

    function hideSummary() { if (summaryEl) summaryEl.classList.remove('visible'); }

    /* Show summary on all fields filled */
    form.addEventListener('input', () => {
        const allFilled = courtSelect.value && dateInput.value && startInput.value && endInput.value &&
            document.getElementById('first_name').value && document.getElementById('last_name').value &&
            document.getElementById('email').value;
        if (allFilled && startInput.value < endInput.value) showSummary();
        else hideSummary();
    });

    /* Form submission */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        const payload = {
            first_name: document.getElementById('first_name').value.trim(),
            last_name: document.getElementById('last_name').value.trim(),
            email: document.getElementById('email').value.trim().toLowerCase(),
            phone: document.getElementById('phone').value.trim(),
            court_id: parseInt(courtSelect.value),
            booking_date: dateInput.value,
            start_time: startInput.value,
            end_time: endInput.value,
            promo_code: promoInput.value.trim()
        };

        try {
            const res = await apiPost('reservations.php', payload);
            showToast(res.message, 'success');
            form.reset();
            hideSummary();
            amountEl.textContent = '—';
            breakdownEl.textContent = 'Select a court and time';
            unitEl.textContent = '';
            promoStatus.textContent = '';
            promoDiscount = 0;
        } catch (err) {
            showToast(err.message || 'Booking failed. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirm Reservation →';
        }
    });

    loadCourts();
});
