---
phase: 1
plan: 1
wave: 1
gap_closure: false
depends_on: []
files_modified:
  - css/tokens.css
  - css/main.css
  - css/components.css
  - index.html
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Application shell displays a collapsible sidebar, compact top bar, main content viewport, and responsive mobile navigation"
    - "CSS design tokens support sleek Dark Mode as default with a clean Light Mode theme toggle"
    - "Design system includes glassmorphism, harmonious palette (Indigo/Violet, Emerald, Amber, Rose), and WCAG-compliant typography"
    - "First-time welcome container presents clear actions for 'Create My First Routine' and 'Start With Sample Routine'"
  artifacts:
    - css/tokens.css
    - css/main.css
    - css/components.css
    - index.html
---

# Plan 1.1: Project Scaffolding, HTML5 Shell & Design System

## Objective
Establish the core visual foundation, responsive layout architecture, design system tokens, and semantic HTML5 shell for the Routine Tracker, creating an aesthetic, accessible, and high-performance base for all subsequent features.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/DECISIONS.md
- .gsd/REQUIREMENTS.md

## Tasks

<task type="auto">
  <name>Create CSS Design Tokens and Core Layout Stylesheet</name>
  <files>
    css/tokens.css
    css/main.css
  </files>
  <action>
    1. Create `css/tokens.css` with CSS custom properties:
       - Palettes: Primary Indigo/Electric Violet (`#6366f1` / `#8b5cf6`), Emerald (`#10b981`), Amber (`#f59e0b`), Coral/Rose (`#f43f5e`), Slate neutrals.
       - Dark theme defaults (`--bg-primary: #0b0f19`, `--bg-surface: rgba(17, 24, 39, 0.75)`, `--border-color: rgba(255, 255, 255, 0.08)`).
       - Light theme overrides via `[data-theme="light"]` (`--bg-primary: #f8fafc`, `--bg-surface: rgba(255, 255, 255, 0.85)`, `--border-color: rgba(0, 0, 0, 0.08)`).
       - Glassmorphism tokens (`--glass-backdrop: blur(12px)`, `--glass-shadow`, `--glass-border`).
       - Typography tokens (Inter / Outfit font stacks, scale, line-heights).
       - Motion tokens (`--transition-fast`, `--transition-smooth`, `prefers-reduced-motion` fallbacks).
    2. Create `css/main.css`:
       - Modern CSS reset, box-sizing, and typography defaults.
       - App container grid: Collapsible sidebar (260px desktop, collapsed 72px) + fluid main content area.
       - Responsive media queries for desktop (>1024px), tablet (768px-1023px), and mobile (<768px).
    AVOID: Using external heavy CSS frameworks or hardcoding colors without CSS variables.
    USE: Modular CSS variables with semantic names and fallback values.
  </action>
  <verify>
    powershell -Command "Test-Path css/tokens.css; Test-Path css/main.css"
  </verify>
  <done>
    `css/tokens.css` and `css/main.css` exist and contain complete dark/light variables, glassmorphic tokens, and layout grids.
  </done>
</task>

<task type="auto">
  <name>Build Semantic HTML5 App Shell and Component Styles</name>
  <files>
    index.html
    css/components.css
  </files>
  <action>
    1. Create `index.html`:
       - Semantic structure with `<aside id="app-sidebar">`, `<main id="app-main">`, `<header id="app-header">`, and `<nav id="mobile-nav">`.
       - Sidebar nav links: Dashboard (`#dashboard`), My Routines (`#routines`), Progress / Stats (`#stats`), Settings (`#settings`).
       - Top bar: Current date/day display (`#header-date`), active routine dropdown selector (`#header-routine-select`), today's completion progress badge (`#header-progress`), theme toggle button (`#theme-toggle-btn`), and mobile sidebar toggle.
       - Main view panels for active section routing (`#view-dashboard`, `#view-routines`, `#view-stats`, `#view-settings`).
       - Dashboard empty/first-time welcome card (`#welcome-card`) with buttons: "Create My First Routine" (`#btn-create-first`) and "Start With Sample Routine" (`#btn-load-sample`).
       - Container for notifications / toast alerts (`#toast-container`).
    2. Create `css/components.css`:
       - Styling for sidebar items, active indicators, top-bar badges, buttons (`.btn-primary`, `.btn-secondary`, `.btn-ghost`), icon containers, cards, modals/drawers, and glassmorphic welcome banner.
       - Mobile bottom navigation bar styling and drawer sliding transitions.
       - Focus rings (`:focus-visible`) for keyboard accessibility.
  </action>
  <verify>
    powershell -Command "Test-Path index.html; Test-Path css/components.css; Get-Content index.html | Select-String 'app-sidebar', 'app-header', 'welcome-card'"
  </verify>
  <done>
    `index.html` loads design system stylesheets and contains all required shell elements, top bar controls, view containers, and welcome card.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] `css/tokens.css`, `css/main.css`, `css/components.css`, and `index.html` are created and linked properly.
- [ ] Dark theme is set by default and light theme CSS properties are defined.
- [ ] Layout scales smoothly from 320px mobile viewports to wide desktop displays.

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] Zero broken links or missing stylesheets
