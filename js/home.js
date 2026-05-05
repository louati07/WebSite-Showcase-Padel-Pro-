/* PadelPro — Home Page JS */
document.addEventListener('DOMContentLoaded', () => {
    /* Hero Carousel */
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    let current = 0;
    let paused = false;

    function goTo(i) {
        slides[current]?.classList.remove('active');
        dots[current]?.classList.remove('active');
        current = (i + slides.length) % slides.length;
        slides[current]?.classList.add('active');
        dots[current]?.classList.add('active');
    }

    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

    const hero = document.querySelector('.hero');
    if (hero) {
        hero.addEventListener('mouseenter', () => paused = true);
        hero.addEventListener('mouseleave', () => paused = false);
    }

    setInterval(() => { if (!paused && slides.length > 1) goTo(current + 1); }, 5000);

    /* CTA dynamic glow */
    const cta = document.querySelector('.hero-cta');
    if (cta) {
        const colors = ['#c8ff00', '#00e5a0', '#6c63ff', '#ff6b9d', '#c8ff00'];
        let ci = 0;
        cta.addEventListener('mouseenter', () => {
            ci = (ci + 1) % colors.length;
            cta.style.background = colors[ci];
            cta.style.boxShadow = `0 0 30px ${colors[ci]}44`;
        });
        cta.addEventListener('mouseleave', () => {
            cta.style.background = '';
            cta.style.boxShadow = '';
        });
    }

    /* Counter animation */
    const counters = document.querySelectorAll('.stat-number');
    const counterObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                const suffix = el.dataset.suffix || '';
                let count = 0;
                const step = Math.max(1, Math.floor(target / 60));
                const timer = setInterval(() => {
                    count += step;
                    if (count >= target) { count = target; clearInterval(timer); }
                    el.textContent = count + suffix;
                }, 25);
                counterObs.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObs.observe(c));
});
