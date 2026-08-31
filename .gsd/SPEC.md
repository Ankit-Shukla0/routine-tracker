# SPEC.md — Project Specification

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: Specification is locked and approved. Ready for phase planning.

## Vision
A modern, premium, responsive Routine Tracker web application that empowers users to build, manage, and follow completely personalized daily schedules. Instead of forcing rigid, pre-set routines, it supports both precise time-slotted tasks and flexible floating tasks, live timeline tracking with real-time active highlighting, automated missed task management with retroactive completion and rescheduling, customizable audio/visual alerts, deep progress & streak statistics, and multi-routine day-of-week scheduling with seamless local persistence.

---

## Goals

1. **Custom Routine Creation & Management**: Allow users to create unlimited routines and tasks with custom start/end times, durations, categories, icons, descriptions, reordering, and enable/disable toggles (no hardcoded fixed routines).
2. **Dual Task Mode Support**: Seamlessly support and distinguish both time-slotted tasks (scheduled time windows with real-time active highlight) and flexible/floating tasks (duration-based or anytime checklist items).
3. **Dynamic Daily Timeline & Live Status Engine**: Deliver an interactive daily timeline showing completed, active/current, upcoming, and missed tasks. Automatically detect missed tasks when their scheduled window elapses while allowing retroactive completion or rescheduling.
4. **Multi-Routine & Day-Based Scheduling**: Enable users to create multiple routine presets (e.g., Weekday, Weekend, Gym Day), assign them to specific days of the week, duplicate/copy routines, and switch active routines on demand.
5. **Productivity Analytics & Streak Tracking**: Track daily completion percentages, completed vs. pending tasks, consecutive day streaks, weekly completion heatmaps, and category breakdown statistics.
6. **Smart Alerts & Multi-Channel Reminders**: Provide configurable browser notifications, subtle non-intrusive Web Audio chimes, and in-app dynamic banners for upcoming and active task transitions with complete user toggle controls.
7. **Premium Responsive Aesthetic & Offline Storage**: Deliver a polished dark-mode-first aesthetic with glassmorphic accents, modern typography, smooth micro-interactions, responsive mobile/tablet/desktop layouts, and reliable schema-versioned local storage with JSON export/import.

---

## Non-Goals (Out of Scope)
- **Mandatory Cloud Backend / User Accounts**: App is 100% private and offline-first using client-side storage without requiring cloud logins or external server infrastructure.
- **Complex Multi-User Collaboration**: Built specifically for personal routine mastery and individual productivity.
- **Third-Party Calendar Two-Way Sync (v1.0)**: Direct Google/Apple Calendar two-way sync is out of scope for v1.0 (JSON backup/export provided instead).

---

## Users & Use Cases
- **Professionals & Knowledge Workers**: Structure focused work blocks, breaks, and meetings throughout the workday.
- **Students**: Balance class schedules, study sessions, and flexible assignment time blocks.
- **Fitness & Habit Enthusiasts**: Track morning rituals, workout regimens, hydration, and evening wind-down routines.
- **Individuals with Varied Schedules**: Switch between different routines across weekdays and weekends effortlessly.

---

## Constraints
- **Architecture**: Modular Vanilla JavaScript (ES6+ Modules), Semantic HTML5, and Custom CSS Design System (Zero external build overhead, instantaneous loading, native browser performance).
- **Storage**: Browser `localStorage` with data serialization, fallback defaults, and JSON export/import.
- **Audio / Notification Permissions**: Respect browser security models (Web Notifications require user permission prompt; Web Audio initializes on user interaction).
- **Responsive Compatibility**: Flawless layout and touch targets on mobile (320px+), tablet, and desktop viewports.

---

## Success Criteria
- [ ] Users can create, edit, delete, reorder, and duplicate custom routines without any hardcoded defaults.
- [ ] Users can add both time-slotted and flexible tasks with custom attributes (time, duration, category, icon, description).
- [ ] Daily timeline dynamically updates in real time to highlight the current active task and marks uncompleted past tasks as "Missed".
- [ ] Missed tasks can be completed retroactively or rescheduled to another time slot.
- [ ] Multi-routine assignment by day of week works seamlessly.
- [ ] Audio chimes and browser notifications trigger reliably when enabled and can be toggled off.
- [ ] Daily completion rates, streaks, and weekly stats update automatically and persist across page refreshes.
- [ ] Dark theme (default) and Light theme toggle are visually cohesive, accessible, and responsive.
- [ ] Export and import of complete routine and history data in JSON format works without data loss.

---

## Technical Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Modular State & Storage Engine | Must-have | LocalStorage persistence, reactive event emitter, JSON export/import |
| Dual Task Model (Slotted & Flexible) | Must-have | Start/end times, durations, priority, categories, icons, reordering |
| Live Timeline & Status Tracker | Must-have | Real-time interval updates, active highlight, missed state, retroactive actions |
| Multi-Routine & Day Scheduler | Must-have | Day-of-week mapping, routine switching, duplication |
| Alert Engine (Audio & Web Notifications) | Must-have | Web Audio API synthetic cues, Web Notification API, in-app banners |
| Analytics & Streak Engine | Must-have | Daily %, streaks, weekly history, completion stats |
| Responsive UI & Theme Engine | Must-have | Dark/Light mode, glassmorphic accents, modern typography |

---

*Last updated: 2026-09-01*
