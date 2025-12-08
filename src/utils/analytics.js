// Analytics utility for SayEasy
// Privacy-first approach - no personal data, anonymized metrics only

class Analytics {
  constructor() {
    this.isEnabled = true;
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.events = [];
    this.sessionStart = Date.now();
    
    // Check if user has opted out of analytics
    const optOut = localStorage.getItem('sayeasy_analytics_opt_out');
    if (optOut === 'true') {
      this.isEnabled = false;
    }

    // Initialize session tracking
    this.trackSession();
  }

  generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  setUserId(uid) {
    // Use a hashed version of the user ID for privacy
    if (uid) {
      this.userId = 'user_' + this.hashString(uid);
    } else {
      this.userId = null;
    }
  }

  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  optOut() {
    localStorage.setItem('sayeasy_analytics_opt_out', 'true');
    this.isEnabled = false;
    console.log('Analytics opted out');
  }

  optIn() {
    localStorage.removeItem('sayeasy_analytics_opt_out');
    this.isEnabled = true;
    console.log('Analytics opted in');
  }

  trackSession() {
    if (!this.isEnabled) return;

    this.track('session_start', {
      timestamp: this.sessionStart,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      referrer: document.referrer
    });
  }

  track(eventName, properties = {}) {
    if (!this.isEnabled) return;

    const event = {
      event: eventName,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      url: window.location.href,
      ...properties
    };

    this.events.push(event);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics:', eventName, properties);
    }

    // Send to analytics endpoint (implement when ready)
    this.sendEvent(event);
  }

  async sendEvent(event) {
    try {
      // For now, just store locally and batch send later
      // In production, you'd send to your analytics service
      const storedEvents = JSON.parse(localStorage.getItem('sayeasy_analytics_events') || '[]');
      storedEvents.push(event);
      
      // Keep only last 100 events locally
      if (storedEvents.length > 100) {
        storedEvents.splice(0, storedEvents.length - 100);
      }
      
      localStorage.setItem('sayeasy_analytics_events', JSON.stringify(storedEvents));

      // TODO: Implement actual sending to analytics service
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  // Page view tracking
  trackPageView(page, additionalData = {}) {
    this.track('page_view', {
      page,
      ...additionalData
    });
  }

  // User actions
  trackAction(action, details = {}) {
    this.track('user_action', {
      action,
      ...details
    });
  }

  // Feature usage
  trackFeatureUsage(feature, details = {}) {
    this.track('feature_used', {
      feature,
      ...details
    });
  }

  // Errors
  trackError(error, context = {}) {
    this.track('error', {
      error: error.message || error,
      stack: error.stack,
      context,
      severity: context.severity || 'error'
    });
  }

  // Performance metrics
  trackPerformance(metric, value, context = {}) {
    this.track('performance', {
      metric,
      value,
      ...context
    });
  }

  // Subscription events
  trackSubscription(event, details = {}) {
    this.track('subscription', {
      subscriptionEvent: event,
      ...details
    });
  }

  // Get session summary
  getSessionSummary() {
    const sessionDuration = Date.now() - this.sessionStart;
    const sessionEvents = this.events.filter(e => e.sessionId === this.sessionId);
    
    return {
      sessionId: this.sessionId,
      duration: sessionDuration,
      eventCount: sessionEvents.length,
      events: sessionEvents.map(e => e.event),
      userId: this.userId
    };
  }

  // End session (call on app exit)
  endSession() {
    if (!this.isEnabled) return;
    
    const summary = this.getSessionSummary();
    this.track('session_end', summary);
  }
}

// Create singleton instance
const analytics = new Analytics();

// Track page unload
window.addEventListener('beforeunload', () => {
  analytics.endSession();
});

// Track errors globally
window.addEventListener('error', (event) => {
  analytics.trackError(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    severity: 'error'
  });
});

// Track unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  analytics.trackError(event.reason, {
    type: 'unhandled_promise_rejection',
    severity: 'error'
  });
});

export default analytics;