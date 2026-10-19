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

import React from 'react';

// React.lazy caches a rejected import for the life of the lazy component, so
// one failed fetch would break every EChart until a full reload. On failure,
// onFailure receives a fresh lazy component to use from the next render, and
// the error is rethrown so it still reaches the block's ErrorBoundary.
function createLazyReactECharts({ onFailure }) {
  return React.lazy(() =>
    import('./ReactECharts.lazy.js').catch((error) => {
      onFailure(createLazyReactECharts({ onFailure }));
      throw error;
    })
  );
}

export default createLazyReactECharts;
