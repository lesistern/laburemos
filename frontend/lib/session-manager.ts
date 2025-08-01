// Session Management for 30-minute timeout
export class SessionManager {
  private static instance: SessionManager
  private sessionTimeout: NodeJS.Timeout | null = null
  private warningTimeout: NodeJS.Timeout | null = null
  private lastActivity: number = Date.now()
  private isWarningShown: boolean = false
  private callbacks: {
    onWarning: () => void
    onTimeout: () => void
    onActivity: () => void
  } = {
    onWarning: () => {},
    onTimeout: () => {},
    onActivity: () => {}
  }

  // Session timeout: 30 minutes (1800000 ms)
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000
  // Warning time: 5 minutes before timeout (25 minutes)
  private readonly WARNING_TIME = 25 * 60 * 1000

  private constructor() {
    this.setupActivityListeners()
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  // Set callbacks for events
  setCallbacks(callbacks: Partial<typeof this.callbacks>) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  // Start session monitoring
  startSession(): void {
    this.resetTimers()
    this.lastActivity = Date.now()
    this.isWarningShown = false
    
    console.log('🔐 Session started - Auto logout in 30 minutes')
  }

  // Stop session monitoring
  stopSession(): void {
    this.clearTimers()
    console.log('🔐 Session monitoring stopped')
  }

  // Reset activity timers
  private resetTimers(): void {
    this.clearTimers()

    // Set warning timer (25 minutes)
    this.warningTimeout = setTimeout(() => {
      if (!this.isWarningShown) {
        this.isWarningShown = true
        console.log('⚠️ Session warning - 5 minutes until auto logout')
        this.callbacks.onWarning()
      }
    }, this.WARNING_TIME)

    // Set session timeout (30 minutes)
    this.sessionTimeout = setTimeout(() => {
      console.log('⏰ Session expired - Auto logout')
      this.callbacks.onTimeout()
    }, this.SESSION_TIMEOUT)
  }

  // Clear all timers
  private clearTimers(): void {
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout)
      this.warningTimeout = null
    }
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout)
      this.sessionTimeout = null
    }
  }

  // Record user activity
  private recordActivity(): void {
    const now = Date.now()
    
    // Only reset if more than 1 minute has passed since last activity
    if (now - this.lastActivity > 60000) {
      this.lastActivity = now
      this.isWarningShown = false
      this.resetTimers()
      this.callbacks.onActivity()
    }
  }

  // Setup activity listeners
  private setupActivityListeners(): void {
    if (typeof window === 'undefined') return

    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ]

    events.forEach(event => {
      document.addEventListener(event, () => this.recordActivity(), { passive: true })
    })

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.recordActivity()
      }
    })

    // Listen for focus events
    window.addEventListener('focus', () => {
      this.recordActivity()
    })
  }

  // Get time until session expires
  getTimeUntilExpiry(): number {
    return Math.max(0, this.SESSION_TIMEOUT - (Date.now() - this.lastActivity))
  }

  // Get formatted time until expiry
  getFormattedTimeUntilExpiry(): string {
    const ms = this.getTimeUntilExpiry()
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Check if session is active
  isSessionActive(): boolean {
    return this.getTimeUntilExpiry() > 0
  }

  // Extend session (call when user activity detected)
  extendSession(): void {
    this.recordActivity()
  }

  // Manually trigger warning (for testing)
  triggerWarning(): void {
    this.callbacks.onWarning()
  }

  // Manually trigger timeout (for testing)
  triggerTimeout(): void {
    this.callbacks.onTimeout()
  }
}

// Create singleton instance
export const sessionManager = SessionManager.getInstance()

// Export types
export interface SessionCallbacks {
  onWarning: () => void
  onTimeout: () => void
  onActivity: () => void
}