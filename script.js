/* ============================================================
   KARATE JOURNEY — Presentation Engine
   Handles: slide navigation, keyboard, touch, wheel,
            progress bar, dots, animations, fullscreen
   ============================================================ */

(function () {
    'use strict';

    // ---- DOM References ----
    const slides        = document.querySelectorAll('.slide');
    const progressFill  = document.getElementById('progress-fill');
    const currentNum    = document.getElementById('current-slide-num');
    const dotsContainer = document.getElementById('slide-dots');
    const preloader     = document.getElementById('preloader');
    const prevBtn       = document.getElementById('nav-prev');
    const nextBtn       = document.getElementById('nav-next');

    // ---- State ----
    let currentSlide = 0;
    const totalSlides = slides.length;
    let isTransitioning = false;
    const TRANSITION_DURATION = 900; // ms — matches CSS transition

    // ---- Initialize ----
    function init() {
        createDots();
        updateUI();
        bindEvents();
        bindVideoEvents();
        hidePreloader();
    }

    // ---- Preloader ----
    function hidePreloader() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.classList.add('hidden');
            }, 800);
        });
        // Fallback in case load already fired
        if (document.readyState === 'complete') {
            setTimeout(() => {
                preloader.classList.add('hidden');
            }, 800);
        }
    }

    // ---- Dots ----
    function createDots() {
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.classList.add('dot');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    // ---- Navigation ----
    function goToSlide(index) {
        if (isTransitioning || index === currentSlide) return;
        if (index < 0 || index >= totalSlides) return;

        isTransitioning = true;

        // Remove active from current
        slides[currentSlide].classList.remove('active');

        // Set new slide
        currentSlide = index;
        slides[currentSlide].classList.add('active');

        updateUI();

        setTimeout(() => {
            isTransitioning = false;
        }, TRANSITION_DURATION);
    }

    function nextSlide() {
        if (currentSlide < totalSlides - 1) {
            goToSlide(currentSlide + 1);
        }
    }

    function prevSlide() {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    }

    // ---- UI Updates ----
    function updateUI() {
        // Progress bar
        const progress = ((currentSlide + 1) / totalSlides) * 100;
        progressFill.style.width = progress + '%';

        // Counter
        currentNum.textContent = String(currentSlide + 1).padStart(2, '0');

        // Dots
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });

        // Arrow visibility
        prevBtn.style.opacity = currentSlide === 0 ? '0.2' : '';
        prevBtn.style.pointerEvents = currentSlide === 0 ? 'none' : '';
        nextBtn.style.opacity = currentSlide === totalSlides - 1 ? '0.2' : '';
        nextBtn.style.pointerEvents = currentSlide === totalSlides - 1 ? 'none' : '';
    }

    // ---- Video Handling ----
    function bindVideoEvents() {
        const video = document.getElementById('personal-video');
        if (!video) return;

        // Fade out audio in the last 2.5 seconds
        video.addEventListener('timeupdate', () => {
            // Ensure duration is loaded and a valid number
            if (!video.duration || isNaN(video.duration)) return;
            
            const timeLeft = video.duration - video.currentTime;
            if (timeLeft <= 2.5 && timeLeft > 0) {
                // Smoothly reduce volume based on time left
                video.volume = Math.max(0, timeLeft / 2.5);
            }
        });

        // Reset volume when played from start/middle
        video.addEventListener('play', () => {
            if (video.duration && video.currentTime < video.duration - 2.5) {
                video.volume = 1.0;
            }
        });

        // Auto-transition cinematically when video ends
        video.addEventListener('ended', () => {
            nextSlide();
        });
    }

    // ---- Event Binding ----
    function bindEvents() {
        // Arrow buttons
        prevBtn.addEventListener('click', prevSlide);
        nextBtn.addEventListener('click', nextSlide);

        // Keyboard
        document.addEventListener('keydown', handleKeyboard);

        // Mouse wheel / trackpad
        let wheelTimeout;
        document.addEventListener('wheel', (e) => {
            e.preventDefault();
            clearTimeout(wheelTimeout);
            wheelTimeout = setTimeout(() => {
                if (e.deltaY > 0) nextSlide();
                else prevSlide();
            }, 50);
        }, { passive: false });

        // Touch support
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            const threshold = 50;

            // Only horizontal swipes
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
                if (diffX > 0) nextSlide();
                else prevSlide();
            }
            // Vertical swipes
            else if (Math.abs(diffY) > threshold) {
                if (diffY > 0) nextSlide();
                else prevSlide();
            }
        }
    }

    function handleKeyboard(e) {
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
            case 'PageDown':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                prevSlide();
                break;
            case 'Home':
                e.preventDefault();
                goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                goToSlide(totalSlides - 1);
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
            case 'Escape':
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
                break;
        }
    }

    // ---- Fullscreen ----
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    }

    // ---- Particle Effect (subtle ambient particles on all slides) ----
    function createParticles() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particles';
        canvas.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 5;
            pointer-events: none;
            opacity: 0.3;
        `;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let particles = [];
        const PARTICLE_COUNT = 40;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function createParticle() {
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: -Math.random() * 0.4 - 0.1,
                opacity: Math.random() * 0.5 + 0.1,
                life: Math.random() * 200 + 100,
                maxLife: 300,
            };
        }

        function initParticles() {
            particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const p = createParticle();
                p.life = Math.random() * p.maxLife; // stagger
                particles.push(p);
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, i) => {
                p.x += p.speedX;
                p.y += p.speedY;
                p.life--;

                if (p.life <= 0 || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
                    particles[i] = createParticle();
                    particles[i].y = canvas.height + 10;
                }

                const fadeRatio = Math.min(p.life / 50, 1);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212, 168, 67, ${p.opacity * fadeRatio})`;
                ctx.fill();
            });

            requestAnimationFrame(animate);
        }

        resize();
        initParticles();
        animate();
        window.addEventListener('resize', resize);
    }

    // ---- Boot ----
    createParticles();
    init();

})();
