import { Component, type ReactNode } from 'react';

/**
 * ErrorBoundary - Catches runtime errors in the React component tree.
 * Prevents a single component crash from taking down the entire application.
 */

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-icon">⚠️</div>
          <h2>Đã xảy ra lỗi không mong muốn</h2>
          <p className="error-boundary-message">
            {this.state.error?.message || 'Vui lòng thử tải lại trang.'}
          </p>
          <button className="btn btn-primary" onClick={this.handleReset}>
            🔄 Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
