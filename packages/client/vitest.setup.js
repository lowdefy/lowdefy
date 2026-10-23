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

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Node 25 and later define their own localStorage and sessionStorage globals, so vitest's jsdom
// environment leaves those in place of jsdom's. Use jsdom's, as jest's jsdom environment did.
for (const key of ['localStorage', 'sessionStorage']) {
  Object.defineProperty(globalThis, key, {
    value: globalThis.jsdom.window[key],
    configurable: true,
    writable: true,
  });
}

// @testing-library/react unmounts what a test rendered only when afterEach is a global, as it was
// under jest. Without it, a hook from an earlier test stays mounted and keeps writing to window.
afterEach(() => {
  cleanup();
});
