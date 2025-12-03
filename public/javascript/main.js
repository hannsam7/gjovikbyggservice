// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll for all anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            const navbar = document.querySelector('.navbar');
            const navbarHeight = navbar ? navbar.offsetHeight : 0;
            const extra = 16; // small spacing

            if (targetId === '#projects') {
                const title = document.querySelector('#projects .section-title');
                const el = title || targetSection;
                if (el) {
                    const top = window.scrollY + el.getBoundingClientRect().top - navbarHeight - extra;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
                return;
            }
            
            if (targetSection) {
                const top = window.scrollY + targetSection.getBoundingClientRect().top - navbarHeight - extra;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // Active navigation highlighting
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    function highlightNavigation() {
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightNavigation);
    highlightNavigation(); // Call once on load

    // Fade-in animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe project cards and testimonial cards
    const fadeCards = document.querySelectorAll('.project-card, .testimonial-card');
    fadeCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Limit "Beskriv prosjekt" by max words with live counter (strict)
    const descEl = document.querySelector('#contactForm textarea#description');
    if (descEl) {
        const maxWords = parseInt(descEl.dataset.maxWords || '100', 10);
        const counter = document.getElementById('descriptionHelp');
        const warnAt = Math.floor(maxWords * 0.8);

        const tokens = (text) => text.trim().split(/\s+/).filter(Boolean);
        const countWords = (text) => tokens(text).length;
        const firstWords = (text, n) => tokens(text).slice(0, n).join(' ');

        const updateCounter = () => {
            const words = countWords(descEl.value);
            if (!counter) return;
            counter.textContent = `${words}/${maxWords} ord`;
            counter.classList.toggle('warn', words >= warnAt && words <= maxWords);
            counter.classList.toggle('exceeded', words > maxWords);
        };

        // Prevent typing beyond limit
        descEl.addEventListener('beforeinput', (e) => {
            const isInsert = e.inputType && e.inputType.startsWith('insert');
            if (!isInsert) return;

            // ignore paste/drop here; handled by 'paste'
            if (!e.data) return;

            const start = descEl.selectionStart;
            const end = descEl.selectionEnd;
            const nextValue = descEl.value.slice(0, start) + e.data + descEl.value.slice(end);

            if (countWords(nextValue) > maxWords) {
                e.preventDefault();
            }
        });

        // Enforce after input (fallback + IME safety)
        descEl.addEventListener('input', () => {
            if (countWords(descEl.value) > maxWords) {
                descEl.value = firstWords(descEl.value, maxWords);
                descEl.setSelectionRange(descEl.value.length, descEl.value.length);
            }
            updateCounter();
        });

        // Smart paste: only paste allowed words
        descEl.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text') || '';
            const start = descEl.selectionStart;
            const end = descEl.selectionEnd;

            const before = descEl.value.slice(0, start);
            const after = descEl.value.slice(end);

            // words that will remain outside the selection
            const beforeCount = countWords(before);
            const afterCount = countWords(after);
            const allowedForPaste = Math.max(0, maxWords - (beforeCount + afterCount));

            const pasteTrimmed = firstWords(paste, allowedForPaste);
            const next = `${before} ${pasteTrimmed} ${after}`.trim().replace(/\s+/g, ' ');

            descEl.value = next;
            // place caret right after the pasted content
            const caret = (`${before} ${pasteTrimmed}`).trim().replace(/\s+/g, ' ').length;
            descEl.setSelectionRange(caret, caret);
            updateCounter();
        });

        descEl.addEventListener('compositionend', () => {
            if (countWords(descEl.value) > maxWords) {
                descEl.value = firstWords(descEl.value, maxWords);
            }
            updateCounter();
        });

        updateCounter();
    }

    // Projects carousel: improved mobile-friendly version
    const projectsCarousel = document.querySelector('.projects-carousel');
    if (projectsCarousel) {
        const wrapper = projectsCarousel.querySelector('.carousel-track-wrapper');
        const scroller = projectsCarousel.querySelector('.carousel-track');
        const prev = projectsCarousel.querySelector('.carousel-btn.prev');
        const next = projectsCarousel.querySelector('.carousel-btn.next');
        
        // Mobile buttons
        const mobileControls = document.querySelector('.carousel-controls-mobile');
        const prevMobile = mobileControls?.querySelector('.carousel-btn-mobile.prev');
        const nextMobile = mobileControls?.querySelector('.carousel-btn-mobile.next');
        
        const slides = Array.from(scroller.querySelectorAll('.project-card'));

        if (slides.length) {
            let isScrolling = false;
            let touchStartX = 0;
            let touchEndX = 0;

            const getGap = () => {
                const cs = getComputedStyle(scroller);
                return parseFloat(cs.columnGap || cs.gap || 0) || 0;
            };
            
            const getCardWidth = () => {
                if (slides.length === 0) return 0;
                return slides[0].getBoundingClientRect().width;
            };
            
            const getPerView = () => {
                const wrapperWidth = wrapper.clientWidth;
                const cardWidth = getCardWidth();
                const gap = getGap();
                if (cardWidth === 0) return 1;
                return Math.max(1, Math.round((wrapperWidth + gap) / (cardWidth + gap)));
            };
            
            const getStep = () => getPerView() * (getCardWidth() + getGap());

            const getTotalPages = () => Math.max(0, Math.ceil(slides.length / getPerView()) - 1);
            
            const getCurrentPage = () => {
                const step = getStep();
                if (step === 0) return 0;
                return Math.round(scroller.scrollLeft / step);
            };
            
            const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

            function goToPage(p) {
                if (isScrolling) return;
                
                const total = getTotalPages();
                const target = clamp(p, 0, total);
                const scrollTarget = target * getStep();
                
                isScrolling = true;
                scroller.scrollTo({ left: scrollTarget, behavior: 'smooth' });
                
                setTimeout(() => {
                    isScrolling = false;
                }, 500);
            }

            function updateButtons() {
                const p = getCurrentPage();
                const total = getTotalPages();
                
                // Update desktop buttons
                if (prev) prev.disabled = p <= 0;
                if (next) next.disabled = p >= total;
                
                // Update mobile buttons
                if (prevMobile) prevMobile.disabled = p <= 0;
                if (nextMobile) nextMobile.disabled = p >= total;
            }

            // Desktop button navigation
            if (prev) {
                prev.addEventListener('click', () => {
                    goToPage(getCurrentPage() - 1);
                });
            }
            
            if (next) {
                next.addEventListener('click', () => {
                    goToPage(getCurrentPage() + 1);
                });
            }
            
            // Mobile button navigation
            if (prevMobile) {
                prevMobile.addEventListener('click', () => {
                    goToPage(getCurrentPage() - 1);
                });
            }
            
            if (nextMobile) {
                nextMobile.addEventListener('click', () => {
                    goToPage(getCurrentPage() + 1);
                });
            }

            // Touch swipe support for mobile
            scroller.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            scroller.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, { passive: true });

            function handleSwipe() {
                const swipeThreshold = 50;
                const diff = touchStartX - touchEndX;

                if (Math.abs(diff) > swipeThreshold) {
                    if (diff > 0) {
                        // Swiped left - go to next
                        goToPage(getCurrentPage() + 1);
                    } else {
                        // Swiped right - go to previous
                        goToPage(getCurrentPage() - 1);
                    }
                }
            }

            // Update buttons on scroll
            let scrollTimeout;
            scroller.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(updateButtons, 150);
            }, { passive: true });

            // Update on window resize
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    goToPage(getCurrentPage());
                    updateButtons();
                }, 250);
            });

            // Initial update
            updateButtons();

            // Prevent horizontal scroll from affecting body
            scroller.addEventListener('touchmove', (e) => {
                e.stopPropagation();
            }, { passive: true });
        }
    }

    // Prevent body scroll when touching carousel on mobile
    document.body.addEventListener('touchmove', (e) => {
        const carousel = e.target.closest('.carousel-track');
        if (!carousel) return;
        
        // Allow carousel to scroll, prevent body scroll
        e.preventDefault();
    }, { passive: false });
});