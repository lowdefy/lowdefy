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

import fs from 'node:fs';
import path from 'node:path';

import browserOnlyActions from './browserOnlyActions.js';
import createBrowserActionStub from './createBrowserActionStub.js';
import importBuildModule from './importBuildModule.js';

// The client plugins the build wrote, for a page run without a browser: the actions, the client
// operators, the _js functions and the block metas. Imported from the build, so each plugin
// package resolves from the built server's own install, as the browser bundle was made from it.
// No block component is loaded: the runner does what a block's component does for the engine.
// An action only a browser can carry out is replaced by a stub that fails with its name.
async function loadClientPlugins({ buildDirectory }) {
  const [actions, operators, jsMap] = await Promise.all([
    importBuildModule({ buildDirectory, filePath: 'plugins/actions.js' }),
    importBuildModule({ buildDirectory, filePath: 'plugins/operators/client.js' }),
    importBuildModule({ buildDirectory, filePath: 'plugins/operators/clientJsMap.js' }),
  ]);
  const blockMetas = JSON.parse(
    fs.readFileSync(path.join(buildDirectory, 'plugins', 'blockMetas.json'), 'utf8')
  );
  return {
    actions: Object.fromEntries(
      Object.entries(actions.default).map(([actionType, action]) => [
        actionType,
        browserOnlyActions.has(actionType) ? createBrowserActionStub({ actionType }) : action,
      ])
    ),
    blockMetas,
    jsMap: jsMap.default,
    operators: operators.default,
  };
}

export default loadClientPlugins;
