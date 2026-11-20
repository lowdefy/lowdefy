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

import createBrowserLifecycle from './createBrowserLifecycle.js';
import launchBrowser from './launchBrowser.js';
import launchedBrowsers from './launchedBrowsers.js';
import originGuard from './originGuard.js';

// One browser per origin host and port, shared by every headless caller on that origin
// (screenshots, journeys, state inspection, operator evaluation, state loads) and closed after
// 45 s unused. See createBrowserLifecycle.js. Each is launched with host resolver rules and proxy
// switches for its origin, which is why an origin gets its own: they are fixed for the browser's
// life.
const lifecycles = new Map();

function lifecycleForOrigin({ origin }) {
  const guard = originGuard({ origin });
  if (!lifecycles.has(guard)) {
    const lifecycle = createBrowserLifecycle({
      launch: async () => {
        const browser = await launchBrowser({ origin });
        launchedBrowsers.set(browser, { guard, lifecycle });
        return browser;
      },
      idleTimeout: 45_000,
    });
    lifecycles.set(guard, lifecycle);
  }
  return lifecycles.get(guard);
}

export default lifecycleForOrigin;
