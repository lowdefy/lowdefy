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

import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';

import appJson from '../build/app.json';
import lowdefyConfig from '../build/config.json';

const basePath = lowdefyConfig.basePath ?? '';

class LowdefyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
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
