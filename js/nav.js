/* PadelPro — Shared Navigation */
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.main-nav');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    /* Active link */
    document.querySelectorAll('.main-nav a:not(.nav-cta)').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    /* Scroll effect */
    const onScroll = () => {
        if (!header) return;
        header.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Hamburger toggle */
    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('open');
        });
        nav.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                hamburger.classList.remove('active');
                nav.classList.remove('open');
            });
        });
    }

    /* Scroll reveal */
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (reveals.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        reveals.forEach(el => observer.observe(el));
    }
});
