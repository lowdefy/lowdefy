import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    const { description, message, renderError, children } = this.props;
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <div>
          ERROR: {renderError ? 'Error: ' : message} <br />
          {renderError ? `${error.message}` : description} <br />
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
