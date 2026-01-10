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

import createCallAPI from './createCallAPI.js';
import createAuthMethods from './auth/createAuthMethods.js';
import createCallRequest from './createCallRequest.js';
import createIcon from './createIcon.js';
import createLinkComponent from './createLinkComponent.js';
import setupLink from './setupLink.js';

function createLogError(lowdefy, windowObj) {
  // Track logged errors for deduplication
  const loggedErrors = new Set();

  return async function logError(error) {
    // Deduplicate by message + configKey
    const errorKey = `${error.message}:${error.configKey || ''}`;
    if (loggedErrors.has(errorKey)) {
      return;
    }
    loggedErrors.add(errorKey);

    const errorData = {
      message: error.message,
      name: error.name,
      configKey: error.configKey,
      pageId: lowdefy.pageId,
      timestamp: new Date().toISOString(),
    };

    // Try to send to server first with 1s timeout (same-origin)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    try {
      const response = await windowObj.fetch(`${lowdefy.basePath}/api/client-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
        signal: controller.signal,
        credentials: 'same-origin',
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        // Build single log entry with all info
        let vscodeLink = '';
        if (result.link) {
          const match = result.link.match(/^(.+):(\d+)$/);
          if (match) {
            const [, filePath, line] = match;
            vscodeLink = `vscode://file${filePath}?line=${line}`;
          } else {
            vscodeLink = `vscode://file${result.link}`;
          }
        }
        const source = result.source ? `${result.source} at ${result.config}` : '';
        console.error(`[Config Error] ${error.message}\n  ${source}\n  ${vscodeLink}`);
      } else {
        // Server returned error - log locally as fallback
        console.error(`[Config Error] ${error.message}`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Server unreachable or timeout - log locally as fallback
      console.error(`[Config Error] ${error.message}`);
    }
  };
}

function initLowdefyContext({ auth, Components, config, lowdefy, router, stage, types, window }) {
  if (!lowdefy._internal?.initialised) {
    lowdefy._internal = {
      actions: types.actions,
      blockComponents: types.blocks,
      components: {
        Icon: createIcon(types.icons),
      },
      displayMessage: ({ content }) => {
        console.log(content);
        return () => undefined;
      },
      globals: {
        document: window.document,
        fetch: window.fetch,
        window,
      },
      initialised: true,
      link: () => undefined,
      operators: types.operators,
      progress: {
        state: {
          progress: 0,
        },
        dispatch: () => undefined,
      },
      router,
      updaters: {},
    };
    lowdefy.apiResponses = {};
    lowdefy.basePath = router.basePath;
    lowdefy.contexts = {};
    lowdefy.inputs = {};
    lowdefy.lowdefyGlobal = config.rootConfig.lowdefyGlobal;

    lowdefy._internal.callAPI = createCallAPI(lowdefy);
    lowdefy._internal.auth = createAuthMethods(lowdefy, auth);
    lowdefy._internal.callRequest = createCallRequest(lowdefy);
    lowdefy._internal.components.Link = createLinkComponent(lowdefy, Components.Link);
    lowdefy._internal.link = setupLink(lowdefy);
    lowdefy._internal.updateBlock = (blockId) =>
      lowdefy._internal.updaters[blockId] && lowdefy._internal.updaters[blockId]();
    lowdefy._internal.logError = createLogError(lowdefy, window);

    if (stage === 'dev') {
      window.lowdefy = lowdefy;
    }
  }

  lowdefy.home = config.rootConfig.home || {};
  lowdefy.menus = config.rootConfig.menus;
  lowdefy.pageId = config.pageConfig.pageId;
  lowdefy.user = auth?.session?.user ?? null;

  return lowdefy;
}

export default initLowdefyContext;
