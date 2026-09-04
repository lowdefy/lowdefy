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

import safeScriptJson from '../lib/safeScriptJson.js';

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) => HTML_ESCAPES[c]);
}

// Synchronous script that creates the @layer order declaration and keeps it as
// the first child of <head> via MutationObserver. antd's CSS-in-JS uses
// prependQueue to inject <style> tags at the top of <head>, which would
// otherwise make @layer antd the first (lowest priority) layer.
// MutationObserver fires before paint, so the browser never sees the wrong
// cascade order.
const layerOrderScript = `(function(){var s=document.createElement("style");s.id="__lf-layer-order";s.textContent="@layer theme, base, antd, components, utilities;";document.head.prepend(s);new MutationObserver(function(){if(document.head.firstChild!==s)document.head.prepend(s)}).observe(document.head,{childList:true})})();`;

// Synchronous pre-hydration script setting the <html> background and
// color-scheme — prevents a mode-mismatch flash of the page and of browser
// chrome (scrollbars, form controls) on page load. Mirrors useDarkMode.js
// resolution order: configDarkMode → localStorage → prefers-color-scheme.
function darkModeScript({ configColorMode, darkBg, lightBg }) {
  return `(function(){var c=${safeScriptJson(configColorMode)};var db=${safeScriptJson(
    darkBg
  )};var lb=${safeScriptJson(
    lightBg
  )};var d;if(c==="dark")d=true;else if(c==="light")d=false;else{try{var p=localStorage.getItem("lowdefy_darkMode");if(p==="dark")d=true;else if(p==="light")d=false;else d=window.matchMedia("(prefers-color-scheme:dark)").matches}catch(e){d=window.matchMedia("(prefers-color-scheme:dark)").matches}}var bg=d?db:lb;document.documentElement.style.colorScheme=d?"dark":"light";document.documentElement.classList.toggle("dark",d);if(bg)document.documentElement.style.backgroundColor=bg})();`;
}

function template({
  appendBody = '',
  appendHead = '',
  assets,
  basePath = '',
  config,
  pageId,
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
  // The entry's own imports, plus the chunks this page's type-import module
  // needs — a page with no module of its own (a 404, a page the build did not
  // split) adds nothing.
  const modulePreloads = [...assets.imports, ...(assets.pages[pageId] ?? [])]
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
    <script>${darkModeScript({ configColorMode, darkBg, lightBg })}</script>
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
