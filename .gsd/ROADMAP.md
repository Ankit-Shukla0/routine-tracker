---
milestone: v1.0
version: 1.0.0
updated: 2026-09-01T02:07:00+05:30
---

# Roadmap

> **Current Phase:** Not started
> **Status:** planning

## Must-Haves (from SPEC)

- [ ] Complete custom routine creation with zero hardcoded routines (custom tasks, categories, icons, enable/disable)
- [ ] Dual task support: time-slotted tasks with start/end times and flexible/floating tasks with duration or anytime checklists
- [ ] Dynamic daily timeline with live active task highlighting, status updates, and visual progress indicator
- [ ] Automated detection of missed tasks with retroactive completion and rescheduling capabilities
- [ ] Multi-routine management with day-of-week schedule assignments and routine duplication
- [ ] Multi-channel alert system with browser notifications, pleasant audio chimes, and in-app banners
- [ ] Streak tracking, daily completion percentage, and weekly productivity analytics
- [ ] Premium dark mode (default) with light mode toggle, glassmorphic accents, and fully responsive layout
- [ ] Local storage persistence with schema versioning and JSON export/import backup

---

## Phases

### Phase 1: Foundation, Design System & Core State Architecture
**Status:** ✅ Complete
**Objective:** Establish the application scaffold, modern design system tokens (Dark/Light themes, typography, glassmorphism, responsive utilities), modular state management, schema-versioned local storage, and real-time clock service.
**Requirements:** REQ-01, REQ-02, NFR-01, NFR-02

**Plans:**
- [x] Plan 1.1: Project Scaffolding, HTML5 Shell & Design System (Wave 1)
- [x] Plan 1.2: Core State Architecture, Resilient Storage & Real-Time Clock Engine (Wave 2)

---

### Phase 2: Custom Routine Builder & Multi-Routine Management
**Status:** 🔄 In Progress
**Objective:** Build the interactive routine editor supporting unlimited custom routines, time-slotted & flexible task creation, categories & icons, task reordering & toggling, day-of-week assignment (Mon-Sun), and routine duplication.
**Requirements:** REQ-03, REQ-04, REQ-05, REQ-06

**Plans:**
- [ ] Plan 2.1: "My Routines" Dashboard, Routine Modal Form & Schedule Management (Wave 1)
- [ ] Plan 2.2: Task Builder Drawer, Dual Task Modality (Timed & Flexible), Categories & Reordering (Wave 2)

---

### Phase 3: Dynamic Daily Timeline, Real-Time Tracking & Interaction
**Status:** ⬜ Not Started
**Objective:** Deliver the primary daily dashboard timeline displaying today's active routine, real-time current task highlight, live progress ring/bar, and automatic missed task handling with retroactive completion and quick rescheduling.
**Requirements:** REQ-07, REQ-08, REQ-09

**Plans:**
- [ ] Plan 3.1: Daily timeline view, dynamic time indicators, live progress calculation, and status classification (upcoming, current, completed, missed)
- [ ] Plan 3.2: Task interaction engine (completion toggle, retroactive completion, quick reschedule modal, and fluid floating task checklist)

---

### Phase 4: Proactive Alerts & Notification Engine
**Status:** ⬜ Not Started
**Objective:** Implement multi-channel alert delivery including Web Audio API synthetic soothing chimes, Web Notification API reminders, and floating in-app banner toasts with comprehensive user control preferences.
**Requirements:** REQ-10, REQ-11

**Plans:**
- [ ] Plan 4.1: Web Audio chime synthesizer and Web Notification API integration with lead-time reminders
- [ ] Plan 4.2: In-app dynamic toast/banner notification system and alert settings modal (toggle audio/notifications/lead times)

---

### Phase 5: Productivity Analytics, Data Backup & Polish
**Status:** ⬜ Not Started
**Objective:** Implement productivity statistics (daily completion %, streak calculation, weekly completion chart/heatmap, category distribution), JSON export/import backup, keyboard navigation, and responsive UX polish.
**Requirements:** REQ-12, REQ-13, REQ-14, NFR-03, NFR-04

**Plans:**
- [ ] Plan 5.1: Statistics dashboard (daily rate, current/best streak, weekly heatmap/chart, category breakdown)
- [ ] Plan 5.2: JSON data export/import, sample routine templates library, accessibility enhancements, and end-to-end verification

---

## Progress Summary

| Phase | Status | Plans | Complete |
|-------|--------|-------|----------|
| 1. Foundation & State | ✅ | 2/2 | 100% |
| 2. Routine Builder | ⬜ | 0/2 | — |
| 3. Live Daily Timeline | ⬜ | 0/2 | — |
| 4. Alerts & Reminders | ⬜ | 0/2 | — |
| 5. Analytics & Backup | ⬜ | 0/2 | — |


---

## Timeline

| Phase | Started | Completed | Duration |
|-------|---------|-----------|----------|
| 1 | — | — | — |
| 2 | — | — | — |
| 3 | — | — | — |
| 4 | — | — | — |
| 5 | — | — | — |
