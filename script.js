(function () {
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        setupTheme();
        setupScrollProgress();
        setupRevealAnimations();
        setupNavScrollAndActive();
        setupButtons();
        setupMobileMenu();
        setupScrollTop();
        setupContactFormMailto();
    }

    // =========================
    // Theme (persist + icon swap)
    // =========================
    function setupTheme() {
        const body = document.body;
        const THEME_KEY = 'theme';
        const themeBtn = document.querySelector('header button[aria-label="Toggle theme"]');

        // Get initial theme - check localStorage first, then system preference, default to light
        let stored = localStorage.getItem(THEME_KEY);
        let initial;

        if (stored === 'dark' || stored === 'light') {
            initial = stored;
        } else {
            // Check system preference
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            initial = prefersDark ? 'dark' : 'light';
        }

        applyTheme(initial);

        function applyTheme(theme) {
  // Remove dark class if present
  body.classList.remove('dark');
  
  // Add dark class only for dark mode
  if (theme === 'dark') {
    body.classList.add('dark');
  }
  
  // For light mode, we just remove the dark class, using :root defaults
  localStorage.setItem(THEME_KEY, theme);
  updateThemeIcon(theme);
}

        function updateThemeIcon(mode) {
            if (!themeBtn) return;
            if (mode === 'dark') {
                themeBtn.innerHTML = sunSVG(20);
            } else {
                themeBtn.innerHTML = moonSVG(20);
            }
        }

        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const currentTheme = body.classList.contains('dark') ? 'dark' : 'light';
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                applyTheme(newTheme);
            });
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                const userPreference = localStorage.getItem(THEME_KEY);
                if (!userPreference) {
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }

        function sunSVG(size) {
            return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="lucide lucide-sun h-5 w-5" aria-hidden="true">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="M4.93 4.93l1.41 1.41"></path>
          <path d="M17.66 17.66l1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="M6.34 17.66l-1.41 1.41"></path>
          <path d="M19.07 4.93l-1.41 1.41"></path>
        </svg>`;
        }

        function moonSVG(size) {
            return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="lucide lucide-moon h-5 w-5" aria-hidden="true">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>`;
        }
    }

    // =========================
    // Scroll progress bar
    // =========================
    function setupScrollProgress() {
        const progressBar = document.querySelector('.fixed.top-0.left-0.h-1');
        if (!progressBar) return;

        function update() {
            const doc = document.documentElement;
            const scrollTop = window.scrollY || doc.scrollTop || 0;
            const total = Math.max(doc.scrollHeight - window.innerHeight, 1);
            const pct = (scrollTop / total) * 100;
            progressBar.style.width = pct + '%';
        }

        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
    }

    // =========================
    // Reveal-on-scroll animations
    // =========================
    function setupRevealAnimations() {
        const els = Array.from(document.querySelectorAll('[data-animate]'));
        if (!els.length) return;

        const prefersReduced = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const show = (el) => {
            // Remove Tailwind-style initial hide classes if present
            el.classList.remove('opacity-0', 'translate-y-4');
            // Add our visible class that overrides [data-animate] defaults
            el.classList.add('animate-visible');
        };

        if (prefersReduced) {
            els.forEach(show);
            return;
        }

        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    show(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        els.forEach((el) => obs.observe(el));
    }

    // =========================
    // Nav: smooth scroll + active highlight
    // =========================
    function setupNavScrollAndActive() {
        const labelToId = {
            Home: 'home',
            About: 'about',
            Projects: 'projects',
            Skills: 'skills',
            Services: 'services',
            Testimonials: 'testimonials',
            Blog: 'blog',
            Contact: 'contact',
        };
        const idToLabel = Object.fromEntries(Object.entries(labelToId).map(([k, v]) => [v, k]));
        const nav = document.querySelector('header nav[aria-label="Primary"]');
        const navButtons = nav ? Array.from(nav.querySelectorAll('button')) : [];
        const indicatorTemplate = '<span class="absolute -bottom-2 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></span>';

        // click handlers to scroll
        navButtons.forEach((btn) => {
            const label = (btn.textContent || '').trim();
            const id = labelToId[label];
            if (!id) return;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                scrollToId(id);
            });
        });

        // underline indicator handling
        function moveIndicator(toBtn) {
            if (!toBtn) return;

            // Fix the selector - use a different approach to find the underline element
            let underline = toBtn.querySelector('span.bg-gradient-to-r');

            // Remove from others
            navButtons.forEach((b) => {
                if (b !== toBtn) {
                    const u = b.querySelector('span.bg-gradient-to-r');
                    if (u) u.remove();
                }
            });

            // Create if missing
            if (!underline) {
                toBtn.insertAdjacentHTML('beforeend', indicatorTemplate);
            }
        }

        // active text color swap
        function setActiveButton(toBtn) {
            navButtons.forEach((b) => {
                b.classList.remove('active');
            });
            if (toBtn) {
                toBtn.classList.add('active');
                moveIndicator(toBtn);
            }
        }

        // Active section observer
        const sections = Array.from(document.querySelectorAll('main section[id]'));
        if (!sections.length) return;

        const obsActive = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((e) => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            const top = visible[0];
            const id = top && top.target && top.target.id;
            if (!id) return;
            const label = idToLabel[id];
            const btn = navButtons.find((b) => (b.textContent || '').trim() === label);
            setActiveButton(btn || null);
            updateMobileMenuActive(id);
        }, { threshold: 0.55 });

        sections.forEach((s) => obsActive.observe(s));

        function scrollToId(id) {
            const el = document.getElementById(id);
            if (!el) return;
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            closeMobileMenu(); // hide mobile menu if open
        }

        // Expose to other functions
        window.__scrollToId = scrollToId;
        window.__updateMobileMenuActive = updateMobileMenuActive;

        function updateMobileMenuActive(id) {
            const mm = document.querySelector('.mobile-menu');
            if (!mm) return;
            Array.from(mm.querySelectorAll('a')).forEach((a) => {
                const target = a.getAttribute('data-target-id');
                if (target === id) a.classList.add('active');
                else a.classList.remove('active');
            });
        }
    }

    // =========================
    // Buttons (e.g., "View Projects")
    // =========================
    function setupButtons() {
        // View Projects button
        const buttons = Array.from(document.querySelectorAll('button'));
        const viewProjects = buttons.find((b) => (b.textContent || '').includes('View') && (b.textContent || '').includes('Projects'));
        if (viewProjects) {
            viewProjects.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.__scrollToId) window.__scrollToId('projects');
            });
        }
    }

    // =========================
    // Mobile menu (inject)
    // =========================
    function setupMobileMenu() {
        const toggleBtn = document.querySelector('header button[aria-label="Toggle navigation menu"]');
        if (!toggleBtn) return;

        const headerContainer = document.querySelector('header .mx-auto.max-w-6xl');
        if (!headerContainer) return;

        // Build once
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        mobileMenu.setAttribute('role', 'menu');

        const items = [
            { label: 'Home', id: 'home' },
            { label: 'About', id: 'about' },
            { label: 'Projects', id: 'projects' },
            { label: 'Skills', id: 'skills' },
            { label: 'Services', id: 'services' },
            { label: 'Testimonials', id: 'testimonials' },
            { label: 'Blog', id: 'blog' },
            { label: 'Contact', id: 'contact' },
        ];

        items.forEach((it) => {
            const a = document.createElement('a');
            a.href = `#${it.id}`;
            a.textContent = it.label;
            a.setAttribute('data-target-id', it.id);
            a.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.__scrollToId) window.__scrollToId(it.id);
            });
            mobileMenu.appendChild(a);
        });

        headerContainer.appendChild(mobileMenu);

        // Toggle behavior
        toggleBtn.addEventListener('click', () => {
            const open = mobileMenu.classList.toggle('open');
            toggleBtn.setAttribute('aria-expanded', String(open));
            toggleBtn.innerHTML = open ? xSVG(24) : menuSVG(24);
        });

        // Close helper for other parts
        window.closeMobileMenu = function () {
            if (!mobileMenu.classList.contains('open')) return;
            mobileMenu.classList.remove('open');
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.innerHTML = menuSVG(24);
        };

        // Set correct icon at start
        toggleBtn.innerHTML = menuSVG(24);

        function xSVG(size) {
            return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="lucide lucide-x" aria-hidden="true">
          <path d="M18 6 6 18"></path>
          <path d="M6 6 18 18"></path>
        </svg>`;
        }
        function menuSVG(size) {
            return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="lucide lucide-menu" aria-hidden="true">
          <path d="M4 12h16"></path>
          <path d="M4 18h16"></path>
          <path d="M4 6h16"></path>
        </svg>`;
        }
    }

    // =========================
    // Scroll-to-top button (inject)
    // =========================
    function setupScrollTop() {
        const btn = document.createElement('button');
        btn.className = 'scroll-top';
        btn.setAttribute('aria-label', 'Scroll to top');
        btn.innerHTML = arrowUpSVG(20);
        document.body.appendChild(btn);

        function onScroll() {
            const show = (window.scrollY || document.documentElement.scrollTop || 0) > 600;
            if (show) btn.classList.add('show');
            else btn.classList.remove('show');
        }
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        function arrowUpSVG(size) {
            return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="lucide lucide-arrow-up" aria-hidden="true">
          <path d="m5 12 7-7 7 7"></path>
          <path d="M12 19V5"></path>
        </svg>`;
        }
    }

    // =========================
    // Contact form -> mailto:
    // =========================
    function setupContactFormMailto() {
        const form = document.querySelector('#contact form');
        if (!form) return;

        const nameInput = form.querySelector('input[type="text"]');
        const emailInput = form.querySelector('input[type="email"]');
        const messageInput = form.querySelector('textarea');

        // Prefer About email (like TSX) if available; else any mailto on page.
        let toEmail = null;
        const aboutEmailLink = document.querySelector('#about a[href^="mailto:"]');
        const anyEmailLink = document.querySelector('a[href^="mailto:"]');
        if (aboutEmailLink) toEmail = (aboutEmailLink.getAttribute('href') || '').replace(/^mailto:/, '');
        else if (anyEmailLink) toEmail = (anyEmailLink.getAttribute('href') || '').replace(/^mailto:/, '');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = (nameInput && nameInput.value) || '';
            const email = (emailInput && emailInput.value) || '';
            const message = (messageInput && messageInput.value) || '';
            const target = toEmail || 'example@example.com';
            const subject = encodeURIComponent(`Portfolio Inquiry from ${name || 'Visitor'}`);
            const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nEmail: ${email}`);
            window.location.href = `mailto:${target}?subject=${subject}&body=${body}`;
        });
    }

})();