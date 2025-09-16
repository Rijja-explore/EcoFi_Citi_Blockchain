// src/ErrorBoundary.js
import React, { Component } from 'react';

/**
 * Error Boundary component to catch and display errors in the React component tree
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="error-boundary glass-card p-6 rounded-xl max-w-3xl mx-auto my-8">
          <h2 className="text-red-500 text-2xl font-bold mb-4">Something went wrong</h2>
          
          <div className="bg-gray-900/50 p-4 rounded-lg mb-4">
            <p className="text-white mb-2">Error message:</p>
            <p className="text-red-400 font-mono text-sm overflow-auto max-h-32 p-2 bg-gray-900/70 rounded">
              {this.state.error && (this.state.error.message || String(this.state.error))}
            </p>
          </div>
          
          {this.props.showResetButton && (
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gradient-to-r from-custom-purple to-bright-purple text-white px-4 py-2 rounded-lg font-semibold"
            >
              Reset Application
            </button>
          )}
          
          {this.props.children && this.props.fallback === 'children' && (
            <div className="mt-6 opacity-50">
              {this.props.children}
            </div>
          )}
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;