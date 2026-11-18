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

import { appStorageKey } from '@lowdefy/helpers';

import darkModeScript from '../../html/darkModeScript.js';
import layerOrderScript from '../../html/layerOrderScript.js';
import safeScriptJson from '../../html/safeScriptJson.js';
import viewLoader from './viewLoader.js';

const VALID_COLOR_MODES = ['system', 'light', 'dark'];

// The HTML of an MCP App view: a fixed loader, the same for every view page
// and every build. A host caches it across calls and deploys, so it names no
// build's files - the loader script asks the app for them (viewLoader). It
// holds the two pre-render scripts the app's own pages start with, and the
// app's origin and basePath. The app's appendHead and appendBody are left out:
// they are written for the app's own origin, and the host blocks what the view
// does not declare.
function renderViewLoader({ appOrigin, basePath, slug, themeConfig }) {
  const configColorMode = VALID_COLOR_MODES.includes(themeConfig.darkMode)
    ? themeConfig.darkMode
    : 'system';
  const darkBg = themeConfig.antd?.darkToken?.colorBgLayout ?? '#000';
  const lightBg = themeConfig.antd?.lightToken?.colorBgLayout ?? '';
  const settings = { origin: appOrigin, basePath };

  return `<!DOCTYPE html>
<html class="lowdefy">
  <head>
    <meta charset="utf-8" />
    <script>${layerOrderScript}</script>
    <script>${darkModeScript({
      configColorMode,
      darkBg,
      lightBg,
      storageKey: appStorageKey({ basePath, name: 'lowdefy_darkMode', slug }),
    })}</script>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="root"></div>
    <script>(${viewLoader.toString()})(${safeScriptJson(settings)});</script>
  </body>
</html>`;
}

export default renderViewLoader;
