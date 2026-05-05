/* PadelPro — Courts Catalog JS */
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('courts-grid');
    const modal = document.getElementById('court-modal');
    let allCourts = [];
    let activeType = 'all';
    let maxPrice = 200;

    const surfaceImages = {
        'Indoor':    'assets/images/court-indoor.png',
        'Outdoor':   'assets/images/court-outdoor.png',
        'Panoramic': 'assets/images/court-panoramic.png'
    };

    const surfaceDescs = {
        'Indoor':    'Climate-controlled indoor court with professional LED lighting and glass walls. Perfect for year-round play.',
        'Outdoor':   'Open-air court surrounded by landscaped grounds with natural lighting. Ideal for daytime matches.',
        'Panoramic': 'Premium 360° glass-walled court offering stunning views. The ultimate padel experience.'
    };

    async function loadCourts() {
        try {
            const res = await apiGet('courts.php');
            allCourts = res.data || [];
            renderCourts();
        } catch (e) {
            allCourts = [
                {court_id:1,name:'Court A',surface_type:'Indoor',hourly_rate:60},
                {court_id:2,name:'Court B',surface_type:'Indoor',hourly_rate:60},
                {court_id:3,name:'Court C',surface_type:'Outdoor',hourly_rate:50},
                {court_id:4,name:'Court D',surface_type:'Outdoor',hourly_rate:50},
                {court_id:5,name:'Court E',surface_type:'Panoramic',hourly_rate:80},
                {court_id:6,name:'Court F',surface_type:'Panoramic',hourly_rate:80},
                {court_id:7,name:'Court G',surface_type:'Indoor',hourly_rate:70}
            ];
            renderCourts();
        }
    }

    function renderCourts() {
        const filtered = allCourts.filter(c => {
            if (activeType !== 'all' && c.surface_type !== activeType) return false;
            if (c.hourly_rate > maxPrice) return false;
            return true;
        });

        if (!filtered.length) {
            grid.innerHTML = '<div class="no-results"><span class="no-results-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M18.09 5.91A5.97 5.97 0 0 0 12 4a5.97 5.97 0 0 0-6.09 1.91"/><path d="M5.91 18.09A5.97 5.97 0 0 0 12 20a5.97 5.97 0 0 0 6.09-1.91"/><line x1="12" y1="2" x2="12" y2="22"/></svg></span>No courts match your filters.<br>Try adjusting your criteria.</div>';
            return;
        }

        grid.innerHTML = filtered.map(c => `
            <div class="court-card reveal" data-id="${c.court_id}">
                <div class="court-card-image">
                    <img src="${surfaceImages[c.surface_type]}" alt="${c.name}" loading="lazy">
                    <span class="badge badge-${c.surface_type.toLowerCase()}">${c.surface_type}</span>
                </div>
                <div class="court-card-body">
                    <h3 class="court-card-title">${c.name}</h3>
                    <p class="court-card-desc">${surfaceDescs[c.surface_type]}</p>
                    <div class="court-card-footer">
                        <div class="court-card-price">
                            <span class="amount">${c.hourly_rate}</span>
                            <span class="unit">TND/h</span>
                        </div>
                        <button class="court-card-btn" onclick="openModal(${c.court_id})">View Details</button>
                    </div>
                </div>
                <div class="court-tooltip">
                    <div class="tooltip-row"><span class="tooltip-label">Type</span><span class="tooltip-value">${c.surface_type}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Rate</span><span class="tooltip-value">${c.hourly_rate} TND/h</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Status</span><span class="tooltip-value" style="color:var(--success)">● Active</span></div>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.court-card.reveal').forEach((el, i) => {
            setTimeout(() => el.classList.add('visible'), i * 80);
        });
    }

    /* Filters */
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeType = pill.dataset.type;
            renderCourts();
        });
    });

    const rangeInput = document.getElementById('price-range');
    const rangeValue = document.getElementById('range-value');
    if (rangeInput) {
        rangeInput.addEventListener('input', () => {
            maxPrice = parseInt(rangeInput.value);
            rangeValue.textContent = maxPrice + ' TND';
            renderCourts();
        });
    }

    /* Modal */
    window.openModal = async function(id) {
        const court = allCourts.find(c => c.court_id === id);
        if (!court || !modal) return;

        document.getElementById('modal-img').src = surfaceImages[court.surface_type];
        document.getElementById('modal-title').textContent = court.name;
        document.getElementById('modal-desc').textContent = surfaceDescs[court.surface_type];
        document.getElementById('modal-type').textContent = court.surface_type;
        document.getElementById('modal-rate').textContent = court.hourly_rate + ' TND/h';
        document.getElementById('modal-status').textContent = 'Active';
        document.getElementById('modal-book-link').href = 'booking.html?court=' + court.court_id;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeModal = function() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    loadCourts();
});
