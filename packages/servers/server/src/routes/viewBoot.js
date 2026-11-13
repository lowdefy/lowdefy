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

import appMeta from '../../lib/build/appMeta.js';
import lowdefyConfig from '../../lib/build/config.js';
import getAssets from '../html/getAssets.js';

const basePath = lowdefyConfig.basePath ?? '';

// What an MCP App view's loader fetches before it starts the client: the
// current build id, the view entry script and its stylesheets, each a path
// under the app's origin. The loader's HTML is cached by the host across
// deploys, so it names no build's files and asks here on every start.
//
// Public: the loader calls it before it holds a session, and the answer is the
// same for every caller and names no user. Never stored, so a view always
// starts the current build.
//
// Mounted only for an app with a view (app.js), whose build always has the view
// entry (getAssets).
function viewBootHandler(c) {
  c.header('Cache-Control', 'no-store');
  const { view } = getAssets();
  return c.json({
    buildId: appMeta.buildId,
    js: `${basePath}/${view.js}`,
    css: view.css.map((file) => `${basePath}/${file}`),
  });
}

export default viewBootHandler;
