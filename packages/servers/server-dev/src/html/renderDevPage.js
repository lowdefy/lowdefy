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

import safeScriptJson from '../lib/safeScriptJson.js';

// Dev HTML shell — config-free: the client fetches root config and page
// config over the API (SWR), exactly like the old dev pages did. Theme and
// app config are read per request so a lowdefyBuild does not require a
// server restart for the pre-hydration values to update.
//
// @hono/vite-dev-server injects /@vite/client into this response; the
// react-refresh preamble must be inlined here for @vitejs/plugin-react.
const layerOrderScript = `(function(){var s=document.createElement("style");s.id="__lf-layer-order";s.textContent="@layer theme, base, antd, components, utilities;";document.head.prepend(s);new MutationObserver(function(){if(document.head.firstChild!==s)document.head.prepend(s)}).observe(document.head,{childList:true})})();`;

function readBuildJson(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'build', `${name}.json`), 'utf8'));
  } catch {
    return {};
  }
}

function renderDevPage(c, { basePath = '' }) {
  // The resolved caller, injected like the production server's template.js —
  // the client's Auth provider seeds _user from it (roles, organization_id).
  const user = c.get('lowdefyContext')?.user ?? null;
  const themeConfig = readBuildJson('theme');
  const appJson = readBuildJson('app');

  const VALID_COLOR_MODES = ['system', 'light', 'dark'];
  const configColorMode = VALID_COLOR_MODES.includes(themeConfig.darkMode)
    ? themeConfig.darkMode
    : 'system';
  const darkBg = themeConfig?.antd?.darkToken?.colorBgLayout ?? '#000';
  const lightBg = themeConfig?.antd?.lightToken?.colorBgLayout ?? '';

  const darkModeScript = `(function(){var c=${safeScriptJson(
    configColorMode
  )};var db=${safeScriptJson(darkBg)};var lb=${safeScriptJson(
    lightBg
  )};var d;if(c==="dark")d=true;else if(c==="light")d=false;else{try{var p=localStorage.getItem("lowdefy_darkMode");if(p==="dark")d=true;else if(p==="light")d=false;else d=window.matchMedia("(prefers-color-scheme:dark)").matches}catch(e){d=window.matchMedia("(prefers-color-scheme:dark)").matches}}var bg=d?db:lb;document.documentElement.style.colorScheme=d?"dark":"light";document.documentElement.classList.toggle("dark",d);if(bg)document.documentElement.style.backgroundColor=bg})();`;

  const html = `<!DOCTYPE html>
<html class="lowdefy">
  <head>
    <meta charset="utf-8" />
    <script>${layerOrderScript}</script>
    <script>${darkModeScript}</script>
    <link rel="manifest" href="${basePath}/manifest.webmanifest" />
    <link rel="icon" type="image/svg+xml" href="${basePath}/icon.svg" />
    <link rel="apple-touch-icon" href="${basePath}/apple-touch-icon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script type="module">
import RefreshRuntime from '${basePath}/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    ${appJson.html?.appendHead ?? ''}
  </head>
  <body>
    <div id="root"></div>
    <script id="__LOWDEFY_CONFIG__" type="application/json">${safeScriptJson({ basePath, user })}</script>
    ${appJson.html?.appendBody ?? ''}
    <script type="module" src="${basePath}/client/main.jsx"></script>
  </body>
</html>`;

  return c.html(html);
}

export default renderDevPage;
