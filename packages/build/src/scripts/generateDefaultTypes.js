#!/usr/bin/env node
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
import { readFile, writeFile } from '@lowdefy/node-utils';

import createPluginTypesMap from '../utils/createPluginTypesMap.js';

const defaultPackages = [
  '@lowdefy/actions-core',
  '@lowdefy/actions-pdf-make',
  '@lowdefy/blocks-aggrid',
  '@lowdefy/blocks-algolia',
  '@lowdefy/blocks-antd',
  '@lowdefy/blocks-basic',
  '@lowdefy/blocks-color-selectors',
  '@lowdefy/blocks-echarts',
  '@lowdefy/blocks-google-maps',
  '@lowdefy/blocks-loaders',
  '@lowdefy/blocks-markdown',
  '@lowdefy/blocks-qr',
  '@lowdefy/connection-axios-http',
  '@lowdefy/connection-elasticsearch',
  '@lowdefy/connection-google-sheets',
  '@lowdefy/connection-knex',
  '@lowdefy/connection-mongodb',
  '@lowdefy/connection-redis',
  '@lowdefy/connection-sendgrid',
  '@lowdefy/connection-stripe',
  '@lowdefy/operators-change-case',
  '@lowdefy/operators-diff',
  '@lowdefy/operators-js',
  '@lowdefy/operators-moment',
  '@lowdefy/operators-mql',
  '@lowdefy/operators-nunjucks',
  '@lowdefy/operators-uuid',
  '@lowdefy/operators-yaml',
  '@lowdefy/plugin-auth0',
  '@lowdefy/plugin-aws',
  '@lowdefy/plugin-csv',
  '@lowdefy/plugin-next-auth',
];

async function generateDefaultTypesMap() {
  const packageFile = JSON.parse(await readFile(path.resolve(process.cwd(), './package.json')));
  const defaultTypesMap = {
    actions: {},
    auth: {
      adapters: {},
      callbacks: {},
      events: {},
      providers: {},
    },
    blocks: {},
    connections: {},
    icons: {},
    operators: {
      client: {},
      server: {},
    },
    requests: {},
    styles: {
      packages: {},
      blocks: {},
    },
  };

  await Promise.all(
    defaultPackages.map(async (packageName) => {
      const { default: types } = await import(`${packageName}/types`);
      const version =
        packageFile.devDependencies[packageName] || packageFile.dependencies[packageName];
      createPluginTypesMap({
        packageTypes: types,
        typesMap: defaultTypesMap,
        packageName,
        version,
      });
    })
  );

  await writeFile(
    path.resolve(process.cwd(), './dist/defaultTypesMap.js'),
    `const defaultTypesMap = ${JSON.stringify(defaultTypesMap, null, 2)};

export default defaultTypesMap;
`
  );
}

generateDefaultTypesMap();
