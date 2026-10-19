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

import { lazy } from 'react';

// A component whose module loads on first render, for UI that opens on demand (popovers, menus,
// editors), with `preload()` to start the load early (on hover or focus of what opens it) so it
// opens without a wait. Render it inside a Suspense boundary of its own, so loading it never
// suspends the table.
function lazyComponent(load) {
  let promise = null;
  function preload() {
    if (promise === null) promise = load();
    return promise;
  }
  const Component = lazy(preload);
  Component.preload = preload;
  return Component;
}

export default lazyComponent;
