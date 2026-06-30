/* Open Door Media — Main JS
   Handles: mobile nav, services tabs, lottie animations, door animation, marquee
   No dependencies — vanilla JS only. */

(function () {
  'use strict';

  /* ========== INPUT TYPE TRACKING (for hover suppression on touch) ========== */
  document.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') document.documentElement.classList.add('using-touch');
    else if (e.pointerType === 'mouse') document.documentElement.classList.remove('using-touch');
  }, { passive: true });

  /* ========== MOBILE NAV ========== */
  const nav = document.getElementById('site-nav');
  const toggle = document.getElementById('nav-toggle');

  if (nav && toggle) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('navbar--open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (nav.classList.contains('navbar--open') && !nav.contains(e.target)) {
        nav.classList.remove('navbar--open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ========== ACTIVE NAV LINK ========== */
  const path = window.location.pathname;
  const normPath = path.replace(/\.html$/, '');
  document.querySelectorAll('.navbar__links a, .navbar__mobile a').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (link.classList.contains('navbar__cta')) return;
    const normHref = href.replace(/\.html$/, '');
    // Directory links (/services/) match any path under them; page links match exactly
    const isActive = normHref === '/'
      ? (normPath === '/' || normPath === '/index')
      : normHref.endsWith('/')
        ? normPath.startsWith(normHref)
        : normPath === normHref;
    if (isActive) link.classList.add('nav-active');
  });

  /* ========== SERVICES INTERACTIVE PAGE ========== */
  const servicesData = [
    {
      id: 'web',
      label: 'Website Design',
      lottieFile: '/anm/website-design-lottie-sm.json',
      anim: 'matrix code rains → wireframe blinks in',
      blurb: 'Custom website design for churches, nonprofits, and mission-driven organizations. Fast, accessible websites that help people find you, trust you, and take the next step.',
      points: [
        'Custom website design',
        'Webflow, Squarespace, Wix, and custom development',
        'Landing pages and multi-page websites',
        'SEO, copywriting, and content strategy',
      ],
      url: '/services/website-design.html',
    },
    {
      id: 'video',
      label: 'Video Production',
      lottieFile: '/anm/video-production-lottie-sm.json',
      anim: 'film frames flicker → strip threads through → play button pulses',
      blurb: 'Professional video production for churches, nonprofits, and mission-driven organizations. Story-driven videos that help people understand your work, trust your message, and take action.',
      points: [
        'Testimonial and interview videos',
        'Explainer videos and motion graphics',
        'Event coverage, sermon media, and promotional videos',
        'Podcast and radio production',
      ],
      url: '/services/video-production.html',
    },
    {
      id: 'ads',
      label: 'Digital Marketing',
      lottieFile: '/anm/digital-marketing-lottie-sm.json',
      anim: 'graph line draws upward → audience dots converge on target',
      blurb: 'Digital advertising for churches, nonprofits, and mission-driven organizations. Targeted campaigns that help the right people discover your work and take the next step.',
      points: [
        'Google Ads and Meta Ads management',
        'Google Ad Grant management for eligible nonprofits (up to $10,000/mo)',
        'Landing page strategy and campaign optimization',
        'Performance reporting and ongoing management',
      ],
      url: '/services/digital-marketing.html',
    },
  ];

  const tabsEl   = document.getElementById('services-tabs');
  const graphicEl = document.getElementById('panel-graphic');
  const copyEl    = document.getElementById('panel-copy');

  if (tabsEl && graphicEl && copyEl) {
    let activeId    = servicesData[0].id;
    let panelLottie = null;
    let firstRender = true;

    function buildTabs() {
      servicesData.forEach(svc => {
        const btn = document.createElement('button');
        btn.className = 'services-tab' + (svc.id === activeId ? ' active' : '');
        btn.textContent = svc.label;
        btn.dataset.id = svc.id;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', svc.id === activeId ? 'true' : 'false');
        btn.setAttribute('aria-controls', 'panel-copy');
        btn.addEventListener('click', () => activate(svc.id));
        tabsEl.appendChild(btn);
      });
    }

    function renderPanel(svc) {
      // Update graphic
      const animEl = graphicEl.querySelector('.panel-graphic__anim');

      if (panelLottie) { panelLottie.destroy(); panelLottie = null; }

      if (svc.lottieFile && typeof lottie !== 'undefined') {
        animEl.innerHTML = '';
        const ct = document.createElement('div');
        ct.style.cssText = 'width:100%;height:100%;';
        animEl.appendChild(ct);
        const delay = firstRender ? 250 : 0;
        setTimeout(function () {
          panelLottie = lottie.loadAnimation({
            container: ct, renderer: 'svg', loop: false, autoplay: true, path: svc.lottieFile,
          });
        }, delay);
        copyEl.style.setProperty('--copy-delay', '1.25s');
      } else {
        animEl.textContent = svc.anim;
        copyEl.style.setProperty('--copy-delay', '0.3s');
      }

      graphicEl.dataset.href = svc.url;
      graphicEl.classList.remove('is-animating');
      // Force reflow before re-adding class
      void graphicEl.offsetWidth;
      graphicEl.classList.add('is-animating');

      // Update copy
      copyEl.querySelector('h3').textContent = svc.label;
      copyEl.querySelector('p').textContent  = svc.blurb;
      const ul = copyEl.querySelector('.panel-copy__points');
      ul.innerHTML = svc.points.map(p => `<li>${p}</li>`).join('');
      const link = copyEl.querySelector('.panel-copy__link');
      if (link) link.href = svc.url;

      copyEl.classList.remove('is-animating');
      void copyEl.offsetWidth;
      copyEl.classList.add('is-animating');
    }

    function activate(id) {
      activeId = id;
      tabsEl.querySelectorAll('.services-tab').forEach(btn => {
        const isActive = btn.dataset.id === id;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      const svc = servicesData.find(s => s.id === id) || servicesData[0];
      renderPanel(svc);
    }

    graphicEl.addEventListener('click', () => {
      const href = graphicEl.dataset.href;
      if (href) window.location.href = href;
    });

    buildTabs();
    renderPanel(servicesData[0]);
    firstRender = false;
  }

  /* ========== MISSION CHIP TOGGLE ========== */
  function toggleChip(chip) {
    const wasOpen = chip.classList.contains('is-open');
    document.querySelectorAll('.mission-chip.is-open').forEach(c => c.classList.remove('is-open'));
    if (!wasOpen) chip.classList.add('is-open');
  }

  document.querySelectorAll('.mission-chip').forEach(chip => {
    let touchStartX = 0, touchStartY = 0, wasTouched = false;

    chip.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    chip.addEventListener('touchend', e => {
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
      if (dx < 15 && dy < 15) {
        e.preventDefault();
        wasTouched = true;
        toggleChip(chip);
      }
    }, { passive: false });

    chip.addEventListener('click', () => {
      if (wasTouched) { wasTouched = false; return; }
      toggleChip(chip);
    });
  });

  /* ========== SERVICE HERO LOTTIE ========== */
  if (typeof lottie !== 'undefined') {
    const heroContainer = document.querySelector('.svc-hero__graphic[data-lottie]');
    if (heroContainer) {
      let heroLoaded = false;

      function loadHeroLottie() {
        if (heroLoaded) return;
        heroLoaded = true;
        setTimeout(function () {
          lottie.loadAnimation({
            container: heroContainer,
            renderer: heroContainer.dataset.lottieRenderer || 'svg',
            loop: false, autoplay: true,
            path: heroContainer.dataset.lottie,
          });
        }, 250);
      }

      if (window.innerWidth > 960) {
        loadHeroLottie();
      } else {
        function onHeroResize() {
          if (window.innerWidth > 960) {
            window.removeEventListener('resize', onHeroResize);
            loadHeroLottie();
          }
        }
        window.addEventListener('resize', onHeroResize);
      }
    }
  }

  /* ========== LOTTIE SCROLL ICONS ========== */
  if (typeof lottie !== 'undefined') {
    const anims = [];

    document.querySelectorAll('.service-card').forEach(card => {
      const container = card.querySelector('[data-lottie]');
      if (!container) return;

      const anim = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: container.dataset.lottie,
      });
      anims.push({ card, anim });
    });

    if (anims.length) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const match = anims.find(a => a.card === entry.target);
          if (!match) return;
          if (entry.isIntersecting) {
            match.anim.setDirection(1);
            match.anim.goToAndPlay(0, true);
          } else {
            match.anim.setDirection(-1);
            match.anim.play();
          }
        });
      }, { threshold: 0.3 });

      anims.forEach(({ card }) => observer.observe(card));
    }
  }


  /* ========== SECRET DOOR ANIMATION ========== */
  var doorSvgLink  = document.getElementById('secret-door-trigger');
  var doorPanelEl  = document.getElementById('door-panel-el');
  var doorGradEl   = document.getElementById('panel-grad');
  var doorGraphic  = document.querySelector('.door-graphic');
  var doorSvg      = document.querySelector('.secret-door-svg');

  var DOOR_RADIUS   = 100;
  var DOOR_START_CX = 200;
  var DOOR_OPEN_CX  = 100;

  var currentCx     = DOOR_START_CX;
  var isOpen        = false;
  var rollRaf       = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Moves the circle and rotates the gradient in sync (rolling without slipping).
  function setPanel(cx) {
    currentCx = cx;
    if (!doorPanelEl) return;
    doorPanelEl.setAttribute('cx', String(cx));
    if (doorGradEl) {
      var deg = (cx - DOOR_START_CX) / DOOR_RADIUS * (180 / Math.PI);
      doorGradEl.setAttribute('gradientTransform', 'rotate(' + deg.toFixed(2) + ', 0.5, 0.5)');
    }
  }

  function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

  function animateTo(targetCx, dur, onDone) {
    if (rollRaf) { cancelAnimationFrame(rollRaf); rollRaf = null; }
    var startCx = currentCx;
    var t0 = performance.now();
    function frame(now) {
      var t = Math.min((now - t0) / dur, 1);
      setPanel(startCx + (targetCx - startCx) * ease(t));
      if (t < 1) {
        rollRaf = requestAnimationFrame(frame);
      } else {
        rollRaf = null;
        if (onDone) onDone();
      }
    }
    rollRaf = requestAnimationFrame(frame);
  }

  // Hover fully opens/closes the door — gradient rolls in sync with the circle.
  if (doorSvgLink && doorPanelEl && !reducedMotion) {
    doorSvgLink.addEventListener('mouseenter', function () {
      if (isOpen) return;
      animateTo(DOOR_OPEN_CX, 680);
    });
    doorSvgLink.addEventListener('mouseleave', function () {
      if (isOpen) return;
      animateTo(DOOR_START_CX, 560);
    });
  }

  function triggerDoorOpen(href) {
    if (isOpen) return;
    if (rollRaf) { cancelAnimationFrame(rollRaf); rollRaf = null; }
    isOpen = true;

    if (doorSvg) doorSvg.classList.add('is-open');

    function navigate() {
      // Record door position for the hub page's clip-path reveal.
      if (doorSvg) {
        var d = doorSvg.getBoundingClientRect();
        sessionStorage.setItem('vt-door', JSON.stringify({
          t:   Math.round(d.top),
          r:   Math.round(window.innerWidth  - d.right),
          b:   Math.round(window.innerHeight - d.bottom),
          l:   Math.round(d.left),
          rad: Math.round(d.width / 2)
        }));
      }
      window.location.href = href;
    }

    var doorVisible = doorPanelEl && doorGraphic
      && getComputedStyle(doorGraphic).display !== 'none';
    var alreadyOpen = currentCx <= DOOR_OPEN_CX + 2;

    if (doorVisible && !alreadyOpen) {
      // Button was clicked without hovering the SVG first — animate then navigate.
      animateTo(DOOR_OPEN_CX, 680, navigate);
    } else {
      // Door already open from hover, or graphic not visible (mobile) — go immediately.
      navigate();
    }
  }

  if (doorSvgLink) {
    doorSvgLink.addEventListener('click', function (e) {
      e.preventDefault();
      triggerDoorOpen(this.href);
    });
  }

  var doorCtaBtn = document.querySelector('.the-door-block .btn--dark');
  if (doorCtaBtn) {
    doorCtaBtn.addEventListener('click', function (e) {
      e.preventDefault();
      triggerDoorOpen(this.href);
    });
  }

  /* ========== LOGO MARQUEE ========== */
  // Drive via rAF so the position is a continuous modulo — no CSS animation
  // loop boundary means no reset flicker on any device.
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.marquee-track').forEach(function (track) {
      var set = track.querySelector('.marquee-set');
      if (!set) return;

      // Logo width is fixed at 120px in CSS, so this is deterministic.
      var setWidth = set.getBoundingClientRect().width;
      if (!setWidth) return;

      var offset  = 0;
      var lastTs  = null;
      var PX_PER_S = 40; // ~same pace as the original CSS animation

      document.addEventListener('visibilitychange', function () {
        // Prevent a large dt spike after the tab was hidden.
        if (!document.hidden) lastTs = null;
      });

      requestAnimationFrame(function tick(ts) {
        if (lastTs !== null) {
          offset = (offset + PX_PER_S * (ts - lastTs) / 1000) % setWidth;
          track.style.transform = 'translateX(' + (-offset) + 'px)';
        }
        lastTs = ts;
        requestAnimationFrame(tick);
      });
    });
  }

  /* ========== HUB NAV TOGGLE ========== */
  var hubNav    = document.querySelector('.hub-nav');
  var hubToggle = document.getElementById('hub-nav-toggle');

  if (hubNav && hubToggle) {
    hubToggle.addEventListener('click', function () {
      var open = hubNav.classList.toggle('hub-nav--open');
      hubToggle.setAttribute('aria-expanded', String(open));
      hubToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    document.addEventListener('click', function (e) {
      if (hubNav.classList.contains('hub-nav--open') && !hubNav.contains(e.target)) {
        hubNav.classList.remove('hub-nav--open');
        hubToggle.setAttribute('aria-expanded', 'false');
        hubToggle.setAttribute('aria-label', 'Open menu');
      }
    });
  }

})();
