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
  dwdd2610: 'courses'
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
const makePreviewClickable = (previewSelector, linkSelector, opener) => {
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
        if (typeof opener === 'function') {
          opener(href);
        } else {
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      });
    }

    addTouchOverlay(item);
  });
};

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
  const caseStudyCountFromBody = parseInt(document.body?.dataset.caseStudyCount || document.body?.dataset.caseStudiesCount || '0', 10);
  const caseStudyListCount = document.querySelectorAll('#case-studies .case-study-list > li').length || document.querySelectorAll('.case-study-hub__list > li').length;
  const caseStudyCount = (Number.isFinite(caseStudyCountFromBody) && caseStudyCountFromBody > 0) ? caseStudyCountFromBody : caseStudyListCount;

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

// case study modal overlay
const caseStudyModal = document.querySelector('#case-study-modal');
const caseStudyFrame = caseStudyModal ? caseStudyModal.querySelector('iframe') : null;
const caseStudyOpeners = Array.from(document.querySelectorAll('[data-open-case-study]'));
const caseStudyClosers = Array.from(document.querySelectorAll('[data-close-case-study]'));

const closeCaseStudyModal = () => {
  if (!caseStudyModal) return;
  caseStudyModal.classList.remove('is-open');
  caseStudyModal.setAttribute('hidden', 'hidden');
  document.body.classList.remove('modal-open');
};

const openCaseStudyModal = (url) => {
  if (!caseStudyModal || !caseStudyFrame) return;
  if (url) {
    caseStudyFrame.src = url;
  } else if (!caseStudyFrame.src) {
    caseStudyFrame.src = 'case-studies/index.html';
  }
  caseStudyModal.removeAttribute('hidden');
  caseStudyModal.classList.add('is-open');
  document.body.classList.add('modal-open');
};

if (caseStudyOpeners.length && caseStudyModal) {
  caseStudyOpeners.forEach(trigger => {
    trigger.addEventListener('click', evt => {
      const url = trigger.getAttribute('data-open-case-study');
      if (url) {
        evt.preventDefault();
        openCaseStudyModal(url);
      }
    });
  });

  caseStudyClosers.forEach(closeEl => {
    closeEl.addEventListener('click', () => closeCaseStudyModal());
  });

  document.addEventListener('keydown', evt => {
    if (evt.key === 'Escape' && caseStudyModal.classList.contains('is-open')) {
      closeCaseStudyModal();
    }
  });
}

// assignment modal overlay
const assignmentModal = document.querySelector('#assignment-modal');
const assignmentFrame = assignmentModal ? assignmentModal.querySelector('iframe') : null;
const assignmentClosers = assignmentModal ? assignmentModal.querySelectorAll('[data-close-assignment]') : [];
const assignmentExternal = assignmentModal ? assignmentModal.querySelector('[data-open-assignment-external]') : null;

const closeAssignmentModal = () => {
  if (!assignmentModal) return;
  assignmentModal.classList.remove('is-open');
  assignmentModal.setAttribute('hidden', 'hidden');
  document.body.classList.remove('modal-open');
};

const openAssignmentModal = (url) => {
  if (!assignmentModal || !assignmentFrame) return;
  if (url) {
    assignmentFrame.src = url;
    assignmentFrame.dataset.currentHref = url;
  }
  assignmentModal.removeAttribute('hidden');
  assignmentModal.classList.add('is-open');
  document.body.classList.add('modal-open');
};

assignmentClosers.forEach(btn => btn.addEventListener('click', closeAssignmentModal));

document.addEventListener('keydown', evt => {
  if (evt.key === 'Escape' && assignmentModal && assignmentModal.classList.contains('is-open')) {
    closeAssignmentModal();
  }
});

if (assignmentExternal && assignmentFrame) {
  assignmentExternal.addEventListener('click', () => {
    const href = assignmentFrame.dataset.currentHref || assignmentFrame.getAttribute('src');
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
  });
}
// assignment previews open in coursework modal (handler wired above)
makePreviewClickable('.assignment-preview', 'header a[href]', openAssignmentModal);
// case studies still open new window
makePreviewClickable('.case-study-preview', 'a[href$=".pdf"], .card a.btn');

// share buttons for case studies
const shareButtons = Array.from(document.querySelectorAll('.btn-share-case-study'));
if (shareButtons.length) {
  const ensureShareSheet = () => {
    let sheet = document.querySelector('.share-sheet');
    if (sheet) return sheet;

    sheet = document.createElement('div');
    sheet.className = 'share-sheet';
    sheet.innerHTML = `
      <div class="share-sheet__backdrop" data-share-close></div>
      <div class="share-sheet__dialog" role="dialog" aria-modal="true" aria-label="Share this page">
        <header class="share-sheet__header">
          <h3>Share</h3>
          <button class="share-sheet__close" type="button" aria-label="Close share options" data-share-close>&times;</button>
        </header>
        <div class="share-sheet__body">
          <button class="share-sheet__option" data-share-target="copy">Copy link</button>
          <button class="share-sheet__option" data-share-target="email">Email</button>
          <button class="share-sheet__option" data-share-target="facebook">Facebook</button>
          <button class="share-sheet__option" data-share-target="linkedin">LinkedIn</button>
          <button class="share-sheet__option" data-share-target="twitter">Twitter/X</button>
        </div>
      </div>
    `;
    document.body.appendChild(sheet);
    return sheet;
  };

  const openShareSheet = (url, title) => {
    const sheet = ensureShareSheet();
    sheet.classList.add('is-open');
    const close = () => sheet.classList.remove('is-open');

    const options = sheet.querySelectorAll('.share-sheet__option');
    options.forEach(btn => {
      btn.onclick = null;
      btn.addEventListener('click', async () => {
        const target = btn.dataset.shareTarget;
        if (target === 'copy') {
          if (navigator.clipboard?.writeText) {
            try {
              await navigator.clipboard.writeText(url);
              btn.textContent = 'Copied!';
              setTimeout(() => (btn.textContent = 'Copy link'), 1000);
            } catch (_) {
              window.prompt('Copy this link:', url);
            }
          } else {
            window.prompt('Copy this link:', url);
          }
        }
        if (target === 'email') {
          window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`, '_blank');
        }
        if (target === 'facebook') {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener');
        }
        if (target === 'linkedin') {
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'noopener');
        }
        if (target === 'twitter') {
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener');
        }
        close();
      });
    });

    sheet.querySelectorAll('[data-share-close]').forEach(closeEl => {
      closeEl.onclick = close;
    });

    document.addEventListener('keydown', function escClose(evt) {
      if (evt.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escClose);
      }
    });
  };

  const handleShare = async (button) => {
    const rawUrl = button.dataset.shareUrl || window.location.href;
    const url = (() => {
      try {
        return new URL(rawUrl, window.location.href).href;
      } catch (err) {
        return window.location.href;
      }
    })();
    const title = button.dataset.shareTitle || document.title;
    const text = button.dataset.shareText || '';

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // ignore cancellations
      }
    }

    openShareSheet(url, title);
  };

  shareButtons.forEach(btn => {
    btn.addEventListener('click', () => handleShare(btn));
  });
}

// highlight Introduction nav button on modal open
const animateIntroButtons = () => {
  document.querySelectorAll('.page-nav__list--inline .page-nav__item:first-child a').forEach(btn => {
    btn.classList.remove('animate-glow');
    // force reflow to restart animation
    void btn.offsetWidth;
    btn.classList.add('animate-glow');
  });
};

document.addEventListener('DOMContentLoaded', () => {
  animateIntroButtons();
});

// restart the glow when opening the modal on the main page
const modalOpenButtons = Array.from(document.querySelectorAll('.js-open-case-study'));
if (modalOpenButtons.length) {
  modalOpenButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(animateIntroButtons, 500);
    });
  });
}

// coursework collapsible cards
const courseSections = Array.from(document.querySelectorAll('.assignments'));
const courseData = [];
courseSections.forEach(section => {
  const toggle = section.querySelector('.course-toggle');
  const list = section.querySelector('.assignment-list');
  if (!toggle || !list) return;

  // build mini icon list
  const miniList = document.createElement('div');
  miniList.className = 'assignment-icons';
  const items = Array.from(list.querySelectorAll('.assignment-item'));
  items.forEach(item => {
    const titleEl = item.querySelector('h3');
    const iframe = item.querySelector('iframe');
    const link = iframe ? iframe.getAttribute('src') : '#';
    const mini = document.createElement('a');
    mini.className = 'assignment-icon';
    mini.href = link;
    mini.target = '_blank';
    mini.rel = 'noopener noreferrer';
    mini.textContent = titleEl ? titleEl.textContent.trim() : 'View';
    miniList.appendChild(mini);
  });
  miniList.hidden = false;
  miniList.style.display = '';
  list.insertAdjacentElement('afterend', miniList);

  // default to collapsed (mini cards shown)
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = 'Expand to full previews';
  list.hidden = true;
  list.style.display = 'none';

  const collapse = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Expand to full previews';
    list.hidden = true;
    list.style.display = 'none';
    miniList.hidden = false;
    miniList.style.display = '';
  };

  const expand = () => {
    toggle.setAttribute('aria-expanded', 'true');
    toggle.textContent = 'Collapse to mini cards';
    list.hidden = false;
    list.style.display = '';
    miniList.hidden = true;
    miniList.style.display = 'none';
  };

  toggle.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      collapse();
    } else {
      expand();
    }
  });

  // intercept mini icon clicks to open modal
  miniList.addEventListener('click', evt => {
    const link = evt.target.closest('a.assignment-icon');
    if (link && link.href) {
      evt.preventDefault();
      openAssignmentModal(link.href);
    }
  });

  courseData.push({ section, toggle, list, miniList, expand, collapse });
});

const expandCourseSection = (sectionId) => {
  const data = courseData.find(entry => `#${entry.section.id}` === sectionId);
  if (data) data.expand();
};

// expand when navigating to section anchors
const courseAnchors = Array.from(document.querySelectorAll('a[href^="#dwdd"]'));
courseAnchors.forEach(link => {
  link.addEventListener('click', () => {
    const targetId = link.getAttribute('href') || '';
    if (targetId.startsWith('#dwdd')) {
      setTimeout(() => expandCourseSection(targetId), 200);
    }
  });
});

if (location.hash && location.hash.startsWith('#dwdd')) {
  expandCourseSection(location.hash);
}

// auto-collapse when section leaves viewport
if ('IntersectionObserver' in window && courseData.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        const data = courseData.find(d => d.section === entry.target);
        if (data) data.collapse();
      }
    });
  }, { threshold: 0.1 });

  courseData.forEach(data => observer.observe(data.section));
}

// Case studies: open directly from cards (no toggle needed)
