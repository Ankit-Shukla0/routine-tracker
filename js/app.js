/**
 * App Controller & Orchestrator
 * Bootstraps the application, coordinates view routing, header updates, and user interactions.
 */

import { store } from './store.js';
import { clockService } from './clock.js';
import { themeController } from './theme.js';

class App {
  constructor() {
    this.sidebarCollapsed = false;
  }

  init() {
    // 1. Initialize Theme & State Store
    themeController.init();
    store.init();

    // 2. Setup Event Listeners & UI Coordination
    this.setupNavigation();
    this.setupSidebarControls();
    this.setupHeaderControls();
    this.setupWelcomeCard();
    this.setupClockSubscribers();
    this.setupStoreSubscribers();

    // 3. Initial UI Render
    this.updateHeaderDate();
    this.renderRoutineDropdown();
    this.renderHeaderProgress();
    this.updateWelcomeCardVisibility();

    console.log('FlowRoutine App initialized successfully.');
  }

  // --- Navigation & View Switching ---

  setupNavigation() {
    // Hash change handler
    window.addEventListener('hashchange', () => {
      this.handleHashChange();
    });

    // Nav link click delegation
    document.querySelectorAll('[data-view]').forEach((elem) => {
      elem.addEventListener('click', (e) => {
        const view = elem.getAttribute('data-view');
        if (view) {
          window.location.hash = `#${view}`;
          this.closeMobileDrawer();
        }
      });
    });

    // Initial hash routing
    this.handleHashChange();
  }

  handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const validViews = ['dashboard', 'routines', 'stats', 'settings'];
    const targetView = validViews.includes(hash) ? hash : 'dashboard';

    // Update active nav items (sidebar + mobile nav)
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach((item) => {
      const itemTarget = item.getAttribute('data-view') || item.getAttribute('href')?.replace('#', '');
      if (itemTarget === targetView) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Switch view containers
    document.querySelectorAll('.view-section').forEach((section) => {
      section.classList.remove('active');
    });

    const activeSection = document.getElementById(`view-${targetView}`);
    if (activeSection) {
      activeSection.classList.add('active');
    }

    store.setCurrentView(targetView);
  }

  // --- Sidebar & Drawer Mechanics ---

  setupSidebarControls() {
    const sidebar = document.getElementById('app-sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
      });
    }

    if (mobileMenuToggle && sidebar) {
      mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.add('mobile-open');
        if (backdrop) backdrop.classList.add('active');
      });
    }

    if (backdrop && sidebar) {
      backdrop.addEventListener('click', () => {
        this.closeMobileDrawer();
      });
    }
  }

  closeMobileDrawer() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  }

  // --- Header Controls & Theme ---

  setupHeaderControls() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = themeController.toggle();
        this.showToast('Theme Changed', `Switched to ${nextTheme} mode`, 'info');
      });
    }

    const routineSelect = document.getElementById('header-routine-select');
    if (routineSelect) {
      routineSelect.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        if (selectedId) {
          store.setActiveRoutine(selectedId);
        }
      });
    }
  }

  updateHeaderDate() {
    const dateText = document.getElementById('header-date-text');
    if (dateText) {
      const now = new Date();
      dateText.textContent = clockService.formatDisplayDate(now);
    }
  }

  renderRoutineDropdown() {
    const select = document.getElementById('header-routine-select');
    const sidebarRoutineName = document.getElementById('sidebar-active-routine-name');
    if (!select) return;

    const routines = store.getRoutines();
    const active = store.getActiveRoutine();

    select.innerHTML = '';

    if (routines.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No routines created';
      opt.disabled = true;
      opt.selected = true;
      select.appendChild(opt);
      if (sidebarRoutineName) sidebarRoutineName.textContent = 'No routine selected';
      return;
    }

    routines.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.icon || '⚡'} ${r.name}`;
      if (active && r.id === active.id) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    if (sidebarRoutineName && active) {
      sidebarRoutineName.textContent = `${active.icon || '⚡'} ${active.name}`;
    }
  }

  renderHeaderProgress() {
    const bar = document.getElementById('header-progress-bar');
    const text = document.getElementById('header-progress-text');
    if (!bar || !text) return;

    const progress = store.calculateTodayProgress();
    bar.style.width = `${progress.percentage}%`;
    text.textContent = `${progress.percentage}%`;
  }

  // --- Welcome Card Actions ---

  setupWelcomeCard() {
    const btnCreateFirst = document.getElementById('btn-create-first');
    const btnLoadSample = document.getElementById('btn-load-sample');

    if (btnCreateFirst) {
      btnCreateFirst.addEventListener('click', () => {
        window.location.hash = '#routines';
      });
    }

    if (btnLoadSample) {
      btnLoadSample.addEventListener('click', () => {
        const sample = store.createSampleRoutine();
        const created = store.addRoutine(sample);
        store.setActiveRoutine(created.id);
        this.showToast('Sample Routine Created', `Loaded "${created.name}" as your active routine!`, 'success');
        this.updateWelcomeCardVisibility();
        this.renderRoutineDropdown();
        this.renderHeaderProgress();
      });
    }
  }

  updateWelcomeCardVisibility() {
    const welcomeCard = document.getElementById('welcome-card');
    if (!welcomeCard) return;

    const routines = store.getRoutines();
    if (routines.length > 0) {
      welcomeCard.style.display = 'none';
    } else {
      welcomeCard.style.display = 'block';
    }
  }

  // --- Clock & Store Event Subscriptions ---

  setupClockSubscribers() {
    clockService.on('minute', () => {
      this.updateHeaderDate();
    });

    clockService.on('dateChange', () => {
      this.updateHeaderDate();
      this.renderHeaderProgress();
    });
  }

  setupStoreSubscribers() {
    store.on('state:changed', () => {
      this.renderRoutineDropdown();
      this.renderHeaderProgress();
      this.updateWelcomeCardVisibility();
    });

    store.on('activeRoutine:changed', () => {
      this.renderRoutineDropdown();
      this.renderHeaderProgress();
    });

    store.on('taskLog:updated', () => {
      this.renderHeaderProgress();
    });
  }

  // --- Modal & Toast Helper System ---

  showToast(title, message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close Toast">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 250);
    });

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }

  openModal(title, bodyHtml, footerHtml = '') {
    const backdrop = document.getElementById('modal-backdrop');
    const container = document.getElementById('modal-container');
    if (!backdrop || !container) return;

    container.innerHTML = `
      <div class="modal-header">
        <h3>${title}</h3>
        <button id="modal-close-btn" class="btn-ghost" style="padding: 4px;" aria-label="Close Modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    `;

    container.querySelector('#modal-close-btn').addEventListener('click', () => this.closeModal());
    backdrop.classList.add('active');
  }

  closeModal() {
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) backdrop.classList.remove('active');
  }
}

// Instantiate and expose application
export const app = new App();

// Bootstrap on DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
}
