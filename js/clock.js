/**
 * Centralized Real-Time Clock Engine & Time Utilities
 * Provides drift-free minute aligned ticks, date rollover detection, and time parsing.
 */

class ClockService {
  constructor() {
    this.listeners = {
      minute: new Set(),
      second: new Set(),
      dateChange: new Set()
    };
    
    this.currentDateStr = this.getTodayDateStr();
    this.minuteTimer = null;
    this.secondTimer = null;
    this.isSecondTickerRunning = false;

    this.init();
  }

  init() {
    // Start minute-level aligned tick
    this.scheduleNextMinuteTick();

    // Visibility change handler (catch up if tab was backgrounded/suspended)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkDateRollover();
          this.emit('minute', {
            dateStr: this.getTodayDateStr(),
            timeStr: this.getCurrentTimeStr(),
            date: new Date()
          });
        }
      });
    }
  }

  scheduleNextMinuteTick() {
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    this.minuteTimer = setTimeout(() => {
      this.handleMinuteTick();
      // Establish regular 60s interval
      this.minuteInterval = setInterval(() => {
        this.handleMinuteTick();
      }, 60000);
    }, Math.max(0, msUntilNextMinute));
  }

  handleMinuteTick() {
    const now = new Date();
    this.checkDateRollover();
    this.emit('minute', {
      dateStr: this.getTodayDateStr(now),
      timeStr: this.getCurrentTimeStr(now),
      date: now
    });
  }

  checkDateRollover() {
    const todayStr = this.getTodayDateStr();
    if (todayStr !== this.currentDateStr) {
      const prevDate = this.currentDateStr;
      this.currentDateStr = todayStr;
      this.emit('dateChange', {
        previousDate: prevDate,
        newDate: todayStr,
        date: new Date()
      });
    }
  }

  startSecondTicker() {
    if (this.isSecondTickerRunning) return;
    this.isSecondTickerRunning = true;
    this.secondTimer = setInterval(() => {
      this.emit('second', {
        dateStr: this.getTodayDateStr(),
        timeStr: this.getCurrentTimeStr(),
        date: new Date()
      });
    }, 1000);
  }

  stopSecondTicker() {
    if (!this.isSecondTickerRunning) return;
    this.isSecondTickerRunning = false;
    clearInterval(this.secondTimer);
    this.secondTimer = null;
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].add(callback);
      if (event === 'second' && this.listeners.second.size === 1) {
        this.startSecondTicker();
      }
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].delete(callback);
      if (event === 'second' && this.listeners.second.size === 0) {
        this.stopSecondTicker();
      }
    }
  }

  emit(event, payload) {
    if (this.listeners[event]) {
      for (const cb of this.listeners[event]) {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in clock event listener for ${event}:`, e);
        }
      }
    }
  }

  // --- Helper & Utility Methods ---

  getTodayDateStr(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getCurrentTimeStr(date = new Date()) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  formatDisplayDate(date = new Date()) {
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }

  formatDisplayTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return '';
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return timeStr;

    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = String(m).padStart(2, '0');
    return `${displayH}:${displayM} ${period}`;
  }

  parseTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  }

  minutesToTimeStr(totalMinutes) {
    const mins = Math.max(0, Math.min(1439, Math.floor(totalMinutes)));
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    return `${h}:${m}`;
  }

  isCurrentTimeBetween(startStr, endStr, currentStr = this.getCurrentTimeStr()) {
    const current = this.parseTimeToMinutes(currentStr);
    const start = this.parseTimeToMinutes(startStr);
    const end = this.parseTimeToMinutes(endStr);

    if (start <= end) {
      return current >= start && current <= end;
    } else {
      // Overnight task (e.g. 23:00 to 07:00)
      return current >= start || current <= end;
    }
  }

  getDayOfWeekIndex(date = new Date()) {
    return date.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  }
}

export const clockService = new ClockService();
