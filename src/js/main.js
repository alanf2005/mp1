/*
 * MP1 interactions: navbar resizing, position indicator, smooth scrolling,
 * carousel, and modals. Plain ES6, no libraries.
 */

const COMPACT_AFTER_PX = 40;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reads the compact navbar height from the CSS variable defined in main.scss.
const getCompactNavHeight = () => {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--nav-height-compact');
    return parseFloat(value) || 60;
};

/* ---------- Navbar resizing + position indicator ---------- */

function initNavbar() {
    const header = document.querySelector('.site-header');
    const links = Array.from(document.querySelectorAll('.nav-link'));
    const sections = links.map((link) => document.querySelector(link.getAttribute('href')));
    let ticking = false;

    const setActive = (activeIndex) => {
        links.forEach((link, index) => {
            const isActive = index === activeIndex;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'location');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    const update = () => {
        ticking = false;
        header.classList.toggle('is-compact', window.scrollY > COMPACT_AFTER_PX);

        // The active section is the one directly below the navbar's bottom edge.
        const navBottom = header.getBoundingClientRect().bottom + 1;
        let activeIndex = sections.findIndex((section) => {
            const rect = section.getBoundingClientRect();
            return rect.top <= navBottom && rect.bottom > navBottom;
        });

        // The last section can be too short to reach the navbar, so force it at the page bottom.
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
        if (atBottom) {
            activeIndex = sections.length - 1;
        }

        setActive(activeIndex);
    };

    const requestUpdate = () => {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
        }
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    // Recheck after the navbar finishes resizing, since its height changes the result.
    header.addEventListener('transitionend', requestUpdate);
    update();
}

/* ---------- Smooth scrolling ---------- */

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const hash = link.getAttribute('href');
            const target = hash.length > 1 ? document.querySelector(hash) : null;
            if (!target) {
                return;
            }

            event.preventDefault();
            const top = target.id === 'home'
                ? 0
                : target.getBoundingClientRect().top + window.scrollY - getCompactNavHeight();

            window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
            window.history.pushState(null, '', hash);
        });
    });
}

/* ---------- Carousel ---------- */

function initCarousel() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) {
        return;
    }

    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const dotsContainer = document.querySelector('.carousel-dots');
    let current = 0;

    const dots = slides.map((slide, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Show slide ${index + 1}`);
        dot.addEventListener('click', () => showSlide(index));
        dotsContainer.appendChild(dot);
        return dot;
    });

    function showSlide(index) {
        current = (index + slides.length) % slides.length; // wraps in both directions
        track.style.setProperty('--slide', current);

        slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== current)));
        dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === current);
            dot.setAttribute('aria-current', String(i === current));
        });
    }

    carousel.querySelector('.carousel-prev').addEventListener('click', () => showSlide(current - 1));
    carousel.querySelector('.carousel-next').addEventListener('click', () => showSlide(current + 1));

    carousel.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            showSlide(current - 1);
        } else if (event.key === 'ArrowRight') {
            showSlide(current + 1);
        }
    });

    showSlide(0);
}

/* ---------- Modals ---------- */

function initModals() {
    let lastTrigger = null;

    const openModal = (modal, trigger) => {
        lastTrigger = trigger;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        modal.querySelector('.modal-close').focus();
    };

    const closeModal = (modal) => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        if (lastTrigger) {
            lastTrigger.focus();
        }
    };

    document.querySelectorAll('[data-modal-open]').forEach((button) => {
        const modal = document.getElementById(button.dataset.modalOpen);
        button.addEventListener('click', () => openModal(modal, button));
    });

    // Close on the X button or a click on the dark overlay outside the dialog.
    document.querySelectorAll('.modal').forEach((modal) => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('[data-modal-close]')) {
                closeModal(modal);
            }
        });
    });

    // Close on Escape.
    document.addEventListener('keydown', (event) => {
        const openModalEl = document.querySelector('.modal.is-open');
        if (event.key === 'Escape' && openModalEl) {
            closeModal(openModalEl);
        }
    });
}

/* ---------- Start ---------- */

function init() {
    initNavbar();
    initSmoothScroll();
    initCarousel();
    initModals();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}