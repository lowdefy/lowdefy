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

import { addNonceToElements, darkModeScript, layerOrderScript } from '@lowdefy/api';
import { appStorageKey, type } from '@lowdefy/helpers';

import safeScriptJson from '../lib/safeScriptJson.js';

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
  nonce = null,
  pageAssets,
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

  // The page's plugin chunks are preloaded with the main entry, so the first
  // render's wait for them overlaps the main bundle's download.
  const cssLinks = [...assets.css, ...pageAssets.css]
    .map((file) => `<link rel="stylesheet" href="${basePath}/${file}" />`)
    .join('\n    ');
  const modulePreloads = [...assets.imports, ...pageAssets.js]
    .map((file) => `<link rel="modulepreload" href="${basePath}/${file}" />`)
    .join('\n    ');
  // Lazy block implementations load on mount; prefetch fills the cache at idle
  // priority. crossorigin matches the CORS mode of the module and stylesheet
  // requests Vite makes on mount, so they are served from that cache.
  const prefetches = pageAssets.prefetch
    .map((file) => `<link rel="prefetch" href="${basePath}/${file}" crossorigin />`)
    .join('\n    ');

  // With a Content-Security-Policy, every script and style element Lowdefy writes
  // or the app appends carries the render's nonce. The csp-nonce meta tag is
  // where the client (antd's style tags) and Vite read it.
  const hasNonce = !type.isNull(nonce);
  const nonceAttribute = hasNonce ? ` nonce="${nonce}"` : '';
  const nonceMeta = hasNonce ? `<meta property="csp-nonce" nonce="${nonce}" />` : '';
  const head = hasNonce ? addNonceToElements({ html: appendHead, nonce }) : appendHead;
  const body = hasNonce ? addNonceToElements({ html: appendBody, nonce }) : appendBody;

  // appendHead and appendBody are intentionally raw HTML from app config
  // (analytics snippets, font links) — they must not be escaped. The config
  // JSON and pre-hydration interpolations go through safeScriptJson.
  return `<!DOCTYPE html>
<html class="lowdefy">
  <head>
    <meta charset="utf-8" />
    ${nonceMeta}
    <script${nonceAttribute}>${layerOrderScript}</script>
    <script${nonceAttribute}>${darkModeScript({
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
    ${prefetches}
    ${head}
  </head>
  <body>
    <div id="root"></div>
    <script id="__LOWDEFY_CONFIG__" type="application/json"${nonceAttribute}>${safeScriptJson(
      config
    )}</script>
    ${body}
    <script type="module" src="${basePath}/${assets.js}"${nonceAttribute}></script>
  </body>
</html>`;
}

export default template;
