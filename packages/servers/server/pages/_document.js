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

const basePath = lowdefyConfig.basePath ?? '';

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
          <link rel="manifest" href={`${basePath}/manifest.webmanifest`} />
          <link rel="icon" type="image/svg+xml" href={`${basePath}/icon.svg`} />
          <link rel="apple-touch-icon" href={`${basePath}/apple-touch-icon.png`} />
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
