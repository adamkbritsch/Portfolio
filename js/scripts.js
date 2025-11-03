// inject current year in footer
const myrightNow = new Date();
document.querySelector('#year').textContent = myrightNow.getFullYear()

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
