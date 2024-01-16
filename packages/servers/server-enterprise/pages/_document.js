/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
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
