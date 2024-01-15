/*
  Copyright 2020-2024 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import React, { Component } from 'react';

import ErrorPage from './ErrorPage.js';

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
    const { children, description, fallback, fullPage, message, name } = this.props;
    const { hasError, error } = this.state;
    if (hasError) {
      if (fallback) {
        return fallback(error);
      }
      if (fullPage) {
        return (
          <ErrorPage
            code={error.number}
            description={description || error.description}
            message={message || error.message}
            name={name || error.name}
          />
        );
      }
      // Throw to console but fail silently to user?
      return '';
    }

    return children;
  }
}

export default ErrorBoundary;
