/**
 * Theme Controller - Dark & Light Theme Management
 * Persists theme choice, toggles DOM data-theme attribute, and syncs icons.
 */

class ThemeController {
  constructor() {
    this.currentTheme = 'dark';
    this.listeners = new Set();
  }

  init(initialTheme = null) {
    let chosenTheme = initialTheme;

    if (!chosenTheme) {
      // Check localStorage first
      const stored = localStorage.getItem('flowroutine_theme');
      if (stored === 'light' || stored === 'dark') {
        chosenTheme = stored;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        chosenTheme = 'light';
      } else {
        chosenTheme = 'dark';
      }
    }

    this.applyTheme(chosenTheme);

    // Watch for OS theme changes if user hasn't explicitly set one
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('flowroutine_theme')) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  toggle() {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme, true);
    return nextTheme;
  }

  applyTheme(theme, persist = false) {
    this.currentTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.currentTheme);

    if (persist) {
      try {
        localStorage.setItem('flowroutine_theme', this.currentTheme);
      } catch (e) {
        console.error('Failed to store theme preference:', e);
      }
    }

    // Update meta theme-color tag for mobile status bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', this.currentTheme === 'dark' ? '#090d16' : '#f8fafc');
    }

    // Update toggle button icons
    const darkIcon = document.getElementById('theme-icon-dark');
    const lightIcon = document.getElementById('theme-icon-light');
    if (darkIcon && lightIcon) {
      if (this.currentTheme === 'dark') {
        darkIcon.style.display = 'block';
        lightIcon.style.display = 'none';
      } else {
        darkIcon.style.display = 'none';
        lightIcon.style.display = 'block';
      }
    }

    // Notify subscribers
    for (const listener of this.listeners) {
      try {
        listener(this.currentTheme);
      } catch (e) {
        console.error('Theme listener error:', e);
      }
    }
  }

  getTheme() {
    return this.currentTheme;
  }

  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export const themeController = new ThemeController();
