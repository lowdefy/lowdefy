/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import path from 'path';
import { createApiContext, getPageConfig, getRootConfig } from '@lowdefy/api';

import config from '../build/config.json';
import fileCache from '../lib/server/fileCache.js';
import Page from '../lib/client/Page.js';

export async function getStaticProps() {
  // Important to give absolute path so Next can trace build files
  const context = {
    buildDirectory: path.join(process.cwd(), 'build'),
    config,
    fileCache,
    logger: console, // TODO: pino or console or 🤷‍♂️?
  };
  createApiContext(context);

  const [rootConfig, pageConfig] = await Promise.all([
    getRootConfig(context),
    getPageConfig(context, { pageId: '404' }),
  ]);

  return {
    props: {
      pageConfig,
      rootConfig,
    },
  };
}

export default Page;
