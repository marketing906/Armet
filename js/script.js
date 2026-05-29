const navbar = document.getElementById('navbar');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const contactForm = document.getElementById('contactForm');
const metricValues = document.querySelectorAll('.metric-value');
const metricCards = document.querySelectorAll('.metric-card');
const metricStates = new WeakMap();
let metricsStarted = false;

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
});

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    document.addEventListener('click', (event) => {
        if (!navLinks.contains(event.target) && !menuToggle.contains(event.target)) {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
        const selector = anchor.getAttribute('href');
        if (!selector || selector === '#') {
            return;
        }

        const target = document.querySelector(selector);
        if (!target) {
            return;
        }

        event.preventDefault();
        const offsetTop = target.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    });
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.18 });

document.querySelectorAll('.reveal-up').forEach((element) => {
    revealObserver.observe(element);
});

function formatMetricValue(value, prefix, suffix) {
    return `${prefix}${value}${suffix}`;
}

function settleMetricValue(element) {
    const state = metricStates.get(element);
    if (!state || state.settled) {
        return;
    }

    state.settled = true;

    if (state.delayId) {
        clearTimeout(state.delayId);
    }

    if (state.intervalId) {
        clearInterval(state.intervalId);
    }

    element.textContent = formatMetricValue(state.target, state.prefix, state.suffix);
    state.card.classList.remove('is-rolling');
    state.card.classList.add('is-settled');
}

function animateMetricValue(element, delay = 0) {
    const target = Number(element.dataset.target || 0);
    const prefix = element.dataset.prefix || '';
    const suffix = element.dataset.suffix || '';
    const card = element.closest('.metric-card');
    const duration = 1800;

    const state = {
        target,
        prefix,
        suffix,
        card,
        delayId: 0,
        intervalId: 0,
        settled: false
    };

    metricStates.set(element, state);

    state.delayId = window.setTimeout(() => {
        const start = performance.now();
        card.classList.add('is-rolling');

        state.intervalId = window.setInterval(() => {
            const progress = Math.min((performance.now() - start) / duration, 1);
            const range = Math.max(target + 1, Math.ceil(target + (1 - progress) * (target * 6 + 18)));
            const randomValue = Math.floor(Math.random() * range);
            element.textContent = formatMetricValue(randomValue, prefix, suffix);

            if (progress >= 1) {
                settleMetricValue(element);
            }
        }, 58);
    }, delay);
}

function startMetricCounters() {
    if (metricsStarted || !metricValues.length) {
        return;
    }

    metricsStarted = true;
    metricValues.forEach((element, index) => animateMetricValue(element, index * 160));
}

metricCards.forEach((card) => {
    const element = card.querySelector('.metric-value');
    if (!element) {
        return;
    }

    card.addEventListener('mouseenter', () => settleMetricValue(element));
    card.addEventListener('focusin', () => settleMetricValue(element));
});

if (metricValues.length) {
    const metricObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting || window.scrollY < 24) {
                return;
            }

            startMetricCounters();
            metricObserver.disconnect();
        });
    }, { threshold: 0.45 });

    metricObserver.observe(metricValues[0]);

    window.addEventListener('scroll', () => {
        if (metricsStarted || window.scrollY < 24) {
            return;
        }

        const firstMetric = metricValues[0];
        const bounds = firstMetric.getBoundingClientRect();
        if (bounds.top < window.innerHeight * 0.9 && bounds.bottom > 0) {
            startMetricCounters();
            metricObserver.disconnect();
        }
    }, { passive: true });
}

function showNotification(message, type = 'success') {
    const current = document.querySelector('.notification');
    if (current) {
        current.remove();
    }

    const notice = document.createElement('div');
    notice.className = 'notification';
    notice.textContent = message;

    Object.assign(notice.style, {
        position: 'fixed',
        top: '96px',
        right: '20px',
        maxWidth: '340px',
        padding: '1rem 1.2rem',
        borderRadius: '18px',
        color: '#fff',
        background: type === 'success' ? 'linear-gradient(135deg, #c8102e, #0f3d91)' : '#941125',
        boxShadow: '0 18px 40px rgba(16, 32, 60, 0.22)',
        zIndex: '9999',
        opacity: '0',
        transform: 'translateY(-10px)',
        transition: 'opacity 220ms ease, transform 220ms ease'
    });

    document.body.appendChild(notice);
    requestAnimationFrame(() => {
        notice.style.opacity = '1';
        notice.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        notice.style.opacity = '0';
        notice.style.transform = 'translateY(-10px)';
        setTimeout(() => notice.remove(), 220);
    }, 4200);
}

function validateInput(input) {
    const value = input.value.trim();
    let valid = true;

    if (input.hasAttribute('required') && !value) {
        valid = false;
    }

    if (input.type === 'email' && value) {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    input.style.borderColor = valid ? '#0f3d91' : '#c8102e';
    input.style.boxShadow = valid ? '0 0 0 4px rgba(15, 61, 145, 0.08)' : '0 0 0 4px rgba(200, 16, 46, 0.08)';
    return valid;
}

if (contactForm) {
    const inputs = contactForm.querySelectorAll('input, select, textarea');

    inputs.forEach((input) => {
        input.addEventListener('blur', () => validateInput(input));
        input.addEventListener('input', () => {
            if (input.value.trim()) {
                validateInput(input);
            } else {
                input.style.borderColor = '';
                input.style.boxShadow = '';
            }
        });
    });

    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const isValid = Array.from(inputs).every((input) => validateInput(input));

        if (!isValid) {
            showNotification('Completa correctamente los campos del formulario.', 'error');
            return;
        }

        const data = Object.fromEntries(new FormData(contactForm));
        console.log('Cotización solicitada:', data);
        contactForm.reset();
        inputs.forEach((input) => {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        });
        showNotification('Tu solicitud fue registrada. Un asesor de ARMET te contactará pronto.');
    });
}
