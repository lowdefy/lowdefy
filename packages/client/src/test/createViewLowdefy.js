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

import { vi } from 'vitest';

import createViewRouter from '../adapters/createViewRouter.js';
import createViewBridge from '../host/createViewBridge.js';
import createViewHost from '../host/createViewHost.js';
import createFakeViewLoader from './createFakeViewLoader.js';

// A lowdefy object on a view host, for link tests: the fake loader over a fake
// MCP Apps host, the view router and the real view host on the test's window,
// which stands in for the host's sandbox frame.
function createViewLowdefy({ basePath = '/base', path = '/tickets/12?tab=notes' } = {}) {
  const view = createFakeViewLoader({ basePath, path });
  const router = createViewRouter({ basePath, path });
  const host = createViewHost({ bridge: createViewBridge({ view }), router, window });
  const lowdefy = {
    basePath,
    home: { pageId: 'home', configured: false },
    inputs: {},
    linkPaths: {},
    pagePaths: {},
    pathMemory: new Map(),
    _internal: {
      displayMessage: vi.fn(),
      globals: host.globals,
      host,
      router,
      translate: (key) => key,
    },
  };
  return { host, lowdefy, openLink: view.host.openLink, router, view };
}

export default createViewLowdefy;
