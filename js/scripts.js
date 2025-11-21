// inject current year in footer
const myrightNow = new Date();
const yearTarget = document.querySelector('#year');
if (yearTarget) {
  yearTarget.textContent = myrightNow.getFullYear();
}

// dropdown helpers
const navGroups = Array.from(document.querySelectorAll('.nav-group'));
const navTriggers = Array.from(document.querySelectorAll('.nav-group__trigger'));
const navLinks = Array.from(document.querySelectorAll('.nav-group__link'));

const closeAllSubmenus = (exception) => {
  navGroups.forEach(group => {
    if (!exception || group !== exception) {
      group.classList.remove('is-expanded');
      const button = group.querySelector('.nav-group__trigger');
      if (button) {
        button.setAttribute('aria-expanded', 'false');
      }
    }
  });
};

if (navTriggers.length) {
  navTriggers.forEach(button => {
    button.addEventListener('click', event => {
      const group = button.closest('.nav-group');
      const isOpen = group.classList.contains('is-expanded');
      closeAllSubmenus(isOpen ? null : group);
      group.classList.toggle('is-expanded', !isOpen);
      button.setAttribute('aria-expanded', (!isOpen).toString());
      event.stopPropagation();
    });

    button.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.defaultPrevented) {
        event.preventDefault();
        button.click();
      }
    });
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.primary-nav')) {
      closeAllSubmenus();
    }
  });
}

if (navLinks.length) {
  navLinks.forEach(link => {
    link.addEventListener('click', () => closeAllSubmenus());
  });
}

// mobile navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const primaryMenu = document.querySelector('#primary-menu');

if (navToggle && primaryMenu) {
  const closeMenu = () => {
    navToggle.setAttribute('aria-expanded', 'false');
    primaryMenu.classList.remove('is-open');
    closeAllSubmenus();
  };

  const toggleMenu = () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      closeMenu();
    } else {
      navToggle.setAttribute('aria-expanded', 'true');
      primaryMenu.classList.add('is-open');
    }
  };

  navToggle.addEventListener('click', toggleMenu);

  primaryMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (navToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      }
    });
  });

  const mdUpQuery = window.matchMedia('(min-width: 35rem)');
  const handleViewportChange = event => {
    if (event.matches) {
      closeMenu();
    }
  };

  if (typeof mdUpQuery.addEventListener === 'function') {
    mdUpQuery.addEventListener('change', handleViewportChange);
  } else if (typeof mdUpQuery.addListener === 'function') {
    mdUpQuery.addListener(handleViewportChange);
  }
}

// compact nav toggle (page nav)
const simpleNavToggle = document.querySelector('.page-nav__toggle');
const pageNav = document.querySelector('.page-nav');
const pageNavMenu = document.querySelector('.page-nav__list');

if (simpleNavToggle && pageNav && pageNavMenu) {
  const toggleSimpleNav = () => {
    const expanded = simpleNavToggle.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      simpleNavToggle.setAttribute('aria-expanded', 'false');
      pageNav.classList.remove('is-open');
    } else {
      simpleNavToggle.setAttribute('aria-expanded', 'true');
      pageNav.classList.add('is-open');
    }
  };

  simpleNavToggle.addEventListener('click', toggleSimpleNav);

  pageNavMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (simpleNavToggle.getAttribute('aria-expanded') === 'true') {
        simpleNavToggle.setAttribute('aria-expanded', 'false');
        pageNav.classList.remove('is-open');
      }
    });
  });

  const mdSwitch = window.matchMedia('(min-width: 40rem)');
  const handleMdSwitch = event => {
    if (event.matches) {
      simpleNavToggle.setAttribute('aria-expanded', 'false');
      pageNav.classList.remove('is-open');
    }
  };

  if (typeof mdSwitch.addEventListener === 'function') {
    mdSwitch.addEventListener('change', handleMdSwitch);
  } else if (typeof mdSwitch.addListener === 'function') {
    mdSwitch.addListener(handleMdSwitch);
  }
}

// intersection observer for section wayfinding
const pageSections = Array.from(document.querySelectorAll('.page-section'));
const pageNavLinks = Array.from(document.querySelectorAll('.page-nav__item a'));
let lastActiveSectionId = null;

let sectionPositions = [];
const offsetAnchor = 200; // keeps long sections active as you scroll
const sectionNavAlias = {
  dwdd1600: 'courses',
  dwdd1720: 'courses',
  dwdd2610: 'courses',
  'case-studies': 'courses'
};

const computeSectionPositions = () => {
  sectionPositions = pageSections.map(section => {
    const rect = section.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const bottom = rect.bottom + window.scrollY;
    return { id: section.id, top, bottom };
  });
};

const setActiveNav = (sectionId) => {
  const navId = sectionNavAlias[sectionId] || sectionId;
  lastActiveSectionId = navId;
  pageNavLinks.forEach(link => {
    const isMatch = link.getAttribute('href') === `#${navId}`;
    const parentItem = link.parentElement;

    if (isMatch) {
      parentItem.classList.add('is-active', 'active');
      link.setAttribute('aria-current', 'page');
    } else {
      parentItem.classList.remove('is-active', 'active');
      link.removeAttribute('aria-current');
    }
  });
};

if (pageSections.length && pageNavLinks.length) {
  pageNavLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      const targetId = href.slice(1);
      link.addEventListener('click', () => setActiveNav(targetId));
    }
  });

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -45% 0px',
    threshold: 0.35
  };

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.id) {
        setActiveNav(entry.target.id);
      }
    });
  }, observerOptions);

  pageSections.forEach(section => sectionObserver.observe(section));
  setActiveNav(pageSections[0].id);
}

// fallback: ensure a section is always marked active on scroll
const findActiveByAnchor = () => {
  if (!sectionPositions.length) computeSectionPositions();
  // ensure the section runs until the next section starts
  const scrollPos = window.scrollY + offsetAnchor;
  let activeId = lastActiveSectionId;

  // pick the last section whose top has passed the offset
  const passed = sectionPositions.filter(pos => scrollPos >= pos.top);
  if (passed.length) {
    const last = passed[passed.length - 1];
    activeId = sectionNavAlias[last.id] || last.id || activeId;
  } else {
    // fallback to nearest center if none passed yet
    const viewportCenter = window.scrollY + window.innerHeight / 2;
    let smallestDist = Infinity;
    sectionPositions.forEach(pos => {
      const center = (pos.top + pos.bottom) / 2;
      const dist = Math.abs(center - viewportCenter);
      if (dist < smallestDist) {
        smallestDist = dist;
        activeId = sectionNavAlias[pos.id] || pos.id || activeId;
      }
    });
  }

  if (activeId) setActiveNav(activeId);
};

let scrollTick = false;
if (pageSections.length) {
  computeSectionPositions();
  window.addEventListener('scroll', () => {
    if (!scrollTick) {
      scrollTick = true;
      window.requestAnimationFrame(() => {
        findActiveByAnchor();
        scrollTick = false;
      });
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    computeSectionPositions();
    findActiveByAnchor();
  });

  window.addEventListener('load', () => {
    computeSectionPositions();
    findActiveByAnchor();
    setTimeout(computeSectionPositions, 800);
    setTimeout(computeSectionPositions, 2000);
  });
}

// make previews clickable and non-scrollable
const makePreviewClickable = (previewSelector, linkSelector) => {
  const items = document.querySelectorAll(previewSelector);

  const addTouchOverlay = (el) => {
    const activate = () => el.classList.add('is-pressed');
    const deactivate = () => el.classList.remove('is-pressed');

    el.addEventListener('touchstart', activate, { passive: true });
    el.addEventListener('touchend', deactivate);
    el.addEventListener('touchcancel', deactivate);
    el.addEventListener('pointerdown', (evt) => {
      if (evt.pointerType === 'touch') activate();
    });
    el.addEventListener('pointerup', deactivate);
    el.addEventListener('pointercancel', deactivate);
    el.addEventListener('pointerleave', deactivate);
  };

  items.forEach(item => {
    const parentArticle = item.closest('article');
    let href = null;
    if (parentArticle) {
      const link = parentArticle.querySelector(linkSelector);
      if (link) href = link.getAttribute('href');
    }
    const iframe = item.querySelector('iframe');
    if (iframe) {
      iframe.setAttribute('scrolling', 'no');
      iframe.style.pointerEvents = 'none';
      if (!href) href = iframe.getAttribute('src');
    }
    if (href) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        window.open(href, '_blank', 'noopener,noreferrer');
      });
    }

    addTouchOverlay(item);
  });
};

makePreviewClickable('.assignment-preview', 'header a[href]');
makePreviewClickable('.case-study-preview', 'a[href$=\".pdf\"], .card a.btn');

// about section stats count-up
const statNumbers = Array.from(document.querySelectorAll('#about .stat-number'));

const animateStat = (el, target, suffix = '') => {
  const duration = 1200;
  const startTime = performance.now();
  const start = 0;

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const current = Math.floor(start + (target - start) * progress);
    el.textContent = current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
};

const updateStatTargets = () => {
  const totalAssignments = document.querySelectorAll('.assignments .assignment-list > li').length;
  const assignments2610 = document.querySelectorAll('#dwdd2610 .assignment-list > li').length;
  const caseStudyCount = document.querySelectorAll('#case-studies .case-study-list > li').length;

  statNumbers.forEach(el => {
    const type = el.dataset.stat;
    if (!type) return;
    let targetValue;
    if (type === 'assignments-total') targetValue = totalAssignments;
    if (type === 'assignments-2610') targetValue = assignments2610;
    if (type === 'case-studies') targetValue = caseStudyCount;
    if (typeof targetValue === 'number') {
      el.dataset.target = targetValue.toString();
      el.dataset.counted = 'false';
      const suffix = el.dataset.suffix || '';
      el.textContent = '0' + suffix;
    }
  });
};

const runStatAnimations = () => {
  statNumbers.forEach(el => {
    if (el.dataset.counted === 'true') return;
    const suffix = el.dataset.suffix || '';
    let target = 0;
    if (el.dataset.target) {
      target = parseFloat(el.dataset.target);
    } else {
      const text = el.textContent.trim();
      const numericPart = text.match(/[\d,.]+/);
      target = numericPart ? parseFloat(numericPart[0].replace(/,/g, '')) : 0;
    }
    animateStat(el, target, suffix);
    el.dataset.counted = 'true';
  });
};

if (statNumbers.length) {
  updateStatTargets();
  const aboutSection = document.querySelector('#about');

  if (aboutSection) {
    const statsObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runStatAnimations();
        }
      });
    }, { threshold: 0.3 });

    statsObserver.observe(aboutSection);

    // run immediately if already in view on load
    if (aboutSection.getBoundingClientRect().top <= window.innerHeight) {
      runStatAnimations();
    }
  }

  // also trigger when clicking About in nav (for quick access)
  document.querySelectorAll('.page-nav__item a[href="#about"]').forEach(link => {
    link.addEventListener('click', () => {
      setTimeout(runStatAnimations, 400);
    });
  });
}
