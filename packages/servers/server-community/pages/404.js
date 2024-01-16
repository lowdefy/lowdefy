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
