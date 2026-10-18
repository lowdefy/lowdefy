/*
  Copyright 2020-2026 Lowdefy, Inc

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

import { Component } from 'react';
import { BlockError } from '@lowdefy/errors';

// A block that throws while rendering is left out, and the error goes to the app's error handler
// as a BlockError, as on the web (@lowdefy/block-utils ErrorBoundary).
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    const { blockId, blockType, configKey, onError, properties } = this.props;
    if (error.isLowdefyError) {
      onError(error);
      return;
    }
    onError(
      new BlockError(error.message, {
        cause: error,
        configKey,
        location: blockId,
        received: properties,
        typeName: blockType,
      })
    );
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
