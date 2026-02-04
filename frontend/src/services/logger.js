/**
 * Logging Service
 * 
 * Centralized logging for the application
 * - Development: Logs to console
 * - Production: Can be integrated with error tracking services (Sentry, LogRocket, etc.)
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

class Logger {
  /**
   * Log general information
   */
  log(...args) {
    if (isDevelopment) {
      console.log('[LOG]', new Date().toISOString(), ...args);
    }
  }

  /**
   * Log errors
   */
  error(...args) {
    if (isDevelopment) {
      console.error('[ERROR]', new Date().toISOString(), ...args);
    }

    // In production, send to error tracking service
    if (isProduction) {
      this.sendToErrorService('error', args);
    }
  }

  /**
   * Log warnings
   */
  warn(...args) {
    if (isDevelopment) {
      console.warn('[WARN]', new Date().toISOString(), ...args);
    }

    if (isProduction) {
      this.sendToErrorService('warn', args);
    }
  }

  /**
   * Log info messages
   */
  info(...args) {
    if (isDevelopment) {
      console.info('[INFO]', new Date().toISOString(), ...args);
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(...args) {
    if (isDevelopment) {
      console.debug('[DEBUG]', new Date().toISOString(), ...args);
    }
  }

  /**
   * Log API calls
   */
  api(method, url, data = null) {
    if (isDevelopment) {
      console.log(
        `[API] ${method.toUpperCase()} ${url}`,
        data ? data : ''
      );
    }
  }

  /**
   * Log API errors
   */
  apiError(method, url, error) {
    if (isDevelopment) {
      console.error(
        `[API ERROR] ${method.toUpperCase()} ${url}`,
        error
      );
    }

    if (isProduction) {
      this.sendToErrorService('api_error', { method, url, error });
    }
  }

  /**
   * Send errors to external service (placeholder)
   * Integrate with Sentry, LogRocket, or similar service
   */
  sendToErrorService(level, data) {
    // TODO: Integrate with error tracking service
    // Example with Sentry:
    // if (window.Sentry) {
    //   if (level === 'error') {
    //     Sentry.captureException(data[0]);
    //   } else {
    //     Sentry.captureMessage(JSON.stringify(data), level);
    //   }
    // }

    // For now, just store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      logs.push({
        level,
        data: JSON.stringify(data),
        timestamp: new Date().toISOString()
      });

      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.shift();
      }

      localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (_e) {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Get stored error logs (for debugging)
   */
  getErrorLogs() {
    try {
      return JSON.parse(localStorage.getItem('error_logs') || '[]');
    } catch (_e) {
      return [];
    }
  }

  /**
   * Clear error logs
   */
  clearErrorLogs() {
    try {
      localStorage.removeItem('error_logs');
    } catch (_e) {
      // Silently fail
    }
  }
}

// Export singleton instance
export default new Logger();
