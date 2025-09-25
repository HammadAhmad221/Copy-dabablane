import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorFallback from './ErrorFallback';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

/**
 * A global error boundary that catches unhandled errors 
 * and displays a user-friendly error message
 */
class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: ''
    };
  }

  static getDerivedStateFromError(_: Error): State {
    return { 
      hasError: true,
      error: "Quelque chose s'est mal passé. Veuillez rafraîchir la page ou réessayer plus tard."
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In development, we can log the error to the console
    if (process.env.NODE_ENV === 'development') {
      console.error('Uncaught error:', error, errorInfo);
    }
    
    // In production, we could send this to an error tracking service
    // like Sentry or LogRocket, but we won't log to console
  }

  handleReset = () => {
    this.setState({ hasError: false, error: '' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          resetErrorBoundary={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary; 