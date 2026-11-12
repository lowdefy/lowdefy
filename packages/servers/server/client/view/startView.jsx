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
import { createRoot } from 'react-dom/client';

import createViewRouter from '@lowdefy/client/adapters/createViewRouter.js';
import createViewBridge from '@lowdefy/client/host/createViewBridge.js';
import createViewHost from '@lowdefy/client/host/createViewHost.js';

import appMeta from '../../build/appMeta.json';
import loadPageTypes from '../loadPageTypes.js';
import loadViewBuild from './loadViewBuild.js';
import loadViewStart from './loadViewStart.js';
import ViewApp from './ViewApp.jsx';

// Starts the client in an MCP App view. view is the object the loader hands
// over; the host handshake is the loader's and is not repeated. The view host
// mints the session on the first call. When the session cannot be had, the app
// cannot be reached or the page cannot be shown, the loader's fallback takes
// over (the tool's title, its result as text and a button to the browser).
async function startView({ view, window }) {
  const { document } = window;
  let bridge;
  try {
    bridge = createViewBridge({ view });
  } catch (error) {
    // Without the loader's object there is no fallback to show either.
    // eslint-disable-next-line no-console
    console.error(error);
    return;
  }
  let host;
  try {
    const router = createViewRouter({ basePath: bridge.basePath, path: bridge.getViewPath() });
    host = createViewHost({ bridge, router, window });
    const start = await loadViewStart({ bundleBuildId: appMeta.buildId, host, loadPageTypes });
    if (host.view.isEnded()) {
      return;
    }
    const root = createRoot(document.getElementById('root'));

    const loadBuild = () => {
      const { pathname, search } = router.getLocation();
      loadViewBuild({
        bridge,
        document,
        fetch: (input, init) => window.fetch(input, init),
        restart: () => startView({ view, window }),
        resumePath: `${pathname.slice(router.basePath.length)}${search}`,
        unmount: () => root.unmount(),
      }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error);
        host.view.end({ message: 'The view could not load the new version of the app.' });
      });
    };

    root.render(<ViewApp host={host} loadBuild={loadBuild} start={start} />);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    const message = 'The view could not load the page.';
    if (host) {
      host.view.end({ message });
    } else {
      bridge.showFallback({ message });
    }
  }
}

export default startView;
