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
import Document, { Html, Head, Main, NextScript } from 'next/document';

import appJson from '../lib/build/app.js';
import lowdefyConfig from '../lib/build/config.js';
import themeConfig from '../lib/build/theme.js';

const basePath = lowdefyConfig.basePath ?? '';
const VALID_COLOR_MODES = ['system', 'light', 'dark'];
const configColorMode = VALID_COLOR_MODES.includes(themeConfig.darkMode)
  ? themeConfig.darkMode
  : 'system';
const darkBg = themeConfig?.antd?.darkToken?.colorBgLayout ?? '#000';
const lightBg = themeConfig?.antd?.lightToken?.colorBgLayout ?? '';

// Escape characters that could break out of the enclosing <script> tag or
// terminate a JS string literal. Used to defuse the js/bad-code-sanitization
// class of injection for values embedded into the pre-hydration inline script.
const SCRIPT_ESCAPES = {
  '<': '\\u003C',
  '>': '\\u003E',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\0': '\\0',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};
function safeScriptJson(value) {
  return JSON.stringify(value).replace(/[<>\b\f\n\r\t\0\u2028\u2029]/g, (c) => SCRIPT_ESCAPES[c]);
}

class LowdefyDocument extends Document {
  render() {
    return (
      <Html className="lowdefy">
        <Head>
          {/* Synchronous script that creates the @layer order declaration and keeps
              it as the first child of <head> via MutationObserver. antd's CSS-in-JS
              uses prependQueue to inject <style> tags at the top of <head>, which
              would otherwise make @layer antd the first (lowest priority) layer.
              MutationObserver fires before paint, so the browser never sees the
              wrong cascade order. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var s=document.createElement("style");s.id="__lf-layer-order";s.textContent="@layer theme, base, antd, components, utilities;";document.head.prepend(s);new MutationObserver(function(){if(document.head.firstChild!==s)document.head.prepend(s)}).observe(document.head,{childList:true})})();`,
            }}
          />
          {/* Synchronous pre-hydration background script — prevents mode-mismatch
              flash on page navigation. Mirrors useDarkMode.js resolution order:
              configDarkMode → localStorage → prefers-color-scheme. Uses the user's
              configured colorBgLayout tokens when present (theme.antd.darkToken and
              theme.antd.lightToken), falling back to #000 in dark and no inline style
              in light so default behavior is unchanged. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var c=${safeScriptJson(configColorMode)};var db=${safeScriptJson(
                darkBg
              )};var lb=${safeScriptJson(
                lightBg
              )};var d;if(c==="dark")d=true;else if(c==="light")d=false;else{try{var p=localStorage.getItem("lowdefy_darkMode");if(p==="dark")d=true;else if(p==="light")d=false;else d=window.matchMedia("(prefers-color-scheme:dark)").matches}catch(e){d=window.matchMedia("(prefers-color-scheme:dark)").matches}}var bg=d?db:lb;if(bg)document.documentElement.style.backgroundColor=bg})();`,
            }}
          />
          <link rel="manifest" href={`${basePath}/manifest.webmanifest`} />
          <link rel="icon" type="image/svg+xml" href={`${basePath}/icon.svg`} />
          <link rel="apple-touch-icon" href={`${basePath}/apple-touch-icon.png`} />
          <link id="tailwind-jit-css" rel="stylesheet" href={`${basePath}/tailwind-jit.css`} />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <script
            dangerouslySetInnerHTML={{
              __html: `/* start of Lowdefy append head */</script>${appJson.html.appendHead}<script>/* end of Lowdefy append head */`,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
          <script
            dangerouslySetInnerHTML={{
              __html: `/* start of Lowdefy append body */</script>${appJson.html.appendBody}<script>/* end of Lowdefy append body */`,
            }}
          />
        </body>
      </Html>
    );
  }
}

export default LowdefyDocument;
