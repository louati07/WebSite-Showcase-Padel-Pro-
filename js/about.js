/* PadelPro — About Page JS */
document.addEventListener('DOMContentLoaded', () => {
    /* Parallax on hero */
    const hero = document.querySelector('.about-hero img');
    if (hero) {
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            hero.style.transform = `translateY(${y * 0.3}px) scale(1.1)`;
        }, { passive: true });
    }
});
