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

import { darkModeScript, layerOrderScript } from '@lowdefy/api';
import safeScriptJson from '@lowdefy/api/html/safeScriptJson.js';
import { appStorageKey } from '@lowdefy/helpers';

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) => HTML_ESCAPES[c]);
}

function template({
  appendBody = '',
  appendHead = '',
  assets,
  basePath = '',
  config,
  slug,
  themeConfig = {},
  title,
}) {
  const VALID_COLOR_MODES = ['system', 'light', 'dark'];
  const configColorMode = VALID_COLOR_MODES.includes(themeConfig.darkMode)
    ? themeConfig.darkMode
    : 'system';
  const darkBg = themeConfig?.antd?.darkToken?.colorBgLayout ?? '#000';
  const lightBg = themeConfig?.antd?.lightToken?.colorBgLayout ?? '';

  const cssLinks = assets.css
    .map((file) => `<link rel="stylesheet" href="${basePath}/${file}" />`)
    .join('\n    ');
  const modulePreloads = assets.imports
    .map((file) => `<link rel="modulepreload" href="${basePath}/${file}" />`)
    .join('\n    ');

  // appendHead and appendBody are intentionally raw HTML from app config
  // (analytics snippets, font links) — they must not be escaped. The config
  // JSON and pre-hydration interpolations go through safeScriptJson.
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
    <link rel="manifest" href="${basePath}/manifest.webmanifest" />
    <link rel="icon" type="image/svg+xml" href="${basePath}/icon.svg" />
    <link rel="apple-touch-icon" href="${basePath}/apple-touch-icon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${title ? `<title>${escapeHtml(title)}</title>` : ''}
    ${cssLinks}
    ${modulePreloads}
    ${appendHead}
  </head>
  <body>
    <div id="root"></div>
    <script id="__LOWDEFY_CONFIG__" type="application/json">${safeScriptJson(config)}</script>
    ${appendBody}
    <script type="module" src="${basePath}/${assets.js}"></script>
  </body>
</html>`;
}

export default template;
