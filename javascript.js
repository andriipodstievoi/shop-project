// Vertical full-page product slider: up/down buttons, dot navigation, keyboard
// arrows, and mouse-wheel navigation, all driven by one eased scroll animation
// so a single wheel notch always glides smoothly to exactly one slide instead
// of the jumpy/inconsistent motion you get from letting the browser's native
// scroll-snap handle raw wheel deltas.
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('fullpageSlider');
    const slides = Array.from(document.querySelectorAll('.fp-slide'));
    const dotsContainer = document.getElementById('slideDots');
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');

    if (!slider || slides.length === 0) return;

    let currentIndex = 0;
    let isAnimating = false;

    const dots = slides.map((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
        return dot;
    });

    function setActive(index) {
        currentIndex = index;
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animateScrollTo(targetTop, duration) {
        const startTop = slider.scrollTop;
        const distance = targetTop - startTop;
        const startTime = performance.now();

        function step(now) {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            slider.scrollTop = startTop + distance * easeInOutCubic(t);
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                isAnimating = false;
            }
        }
        requestAnimationFrame(step);
    }

    function goToSlide(index) {
        if (index < 0 || index >= slides.length || isAnimating) return;
        isAnimating = true;
        setActive(index);
        animateScrollTo(slides[index].offsetTop, 650);
    }

    btnUp.addEventListener('click', () => goToSlide(currentIndex - 1));
    btnDown.addEventListener('click', () => goToSlide(currentIndex + 1));

    slider.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (isAnimating) return;
        goToSlide(currentIndex + (e.deltaY > 0 ? 1 : -1));
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') goToSlide(currentIndex + 1);
        if (e.key === 'ArrowUp') goToSlide(currentIndex - 1);
    });

    // Keeps dots in sync for touch swipes, which bypass the wheel handler above
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !isAnimating) {
                setActive(slides.indexOf(entry.target));
            }
        });
    }, { root: slider, threshold: 0.6 });

    slides.forEach((slide) => observer.observe(slide));
});
