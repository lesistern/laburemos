import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors in the component tree with:
 * - Custom fallback UI
 * - Error logging
 * - Recovery mechanism
 * - Accessibility support
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to external service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <motion.div
          className={`error-boundary ${this.props.className || ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          role="alert"
          aria-live="assertive"
        >
          <div className="error-boundary__container">
            <div className="error-boundary__icon">
              <i className="icon-alert-triangle" aria-hidden="true" />
            </div>
            
            <div className="error-boundary__content">
              <h2 className="error-boundary__title">
                Something went wrong
              </h2>
              
              <p className="error-boundary__message">
                We encountered an unexpected error. This has been logged and our team will investigate.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="error-boundary__details">
                  <summary className="error-boundary__details-summary">
                    Error Details (Development Only)
                  </summary>
                  <div className="error-boundary__error-info">
                    <h3>Error:</h3>
                    <pre className="error-boundary__error-message">
                      {this.state.error.toString()}
                    </pre>
                    
                    {this.state.errorInfo && (
                      <>
                        <h3>Component Stack:</h3>
                        <pre className="error-boundary__error-stack">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}

              <div className="error-boundary__actions">
                <button
                  className="error-boundary__button error-boundary__button--primary"
                  onClick={this.handleRetry}
                  aria-label="Retry loading the component"
                >
                  <i className="icon-refresh-cw" aria-hidden="true" />
                  Try Again
                </button>
                
                <button
                  className="error-boundary__button error-boundary__button--secondary"
                  onClick={this.handleReload}
                  aria-label="Reload the entire page"
                >
                  <i className="icon-home" aria-hidden="true" />
                  Reload Page
                </button>
              </div>

              <div className="error-boundary__support">
                <p className="error-boundary__support-text">
                  If this problem persists, please{' '}
                  <a 
                    href="/support" 
                    className="error-boundary__support-link"
                    aria-label="Contact support team"
                  >
                    contact our support team
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;