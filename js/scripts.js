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

const setActiveNav = (sectionId) => {
  pageNavLinks.forEach(link => {
    const isMatch = link.getAttribute('href') === `#${sectionId}`;
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
