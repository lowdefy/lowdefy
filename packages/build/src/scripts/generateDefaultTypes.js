#!/usr/bin/env node
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

import path from 'path';
import { readFile, writeFile } from '@lowdefy/node-utils';

import createPluginTypesMap from '../utils/createPluginTypesMap.js';
import defaultPackages from '../defaultPackages.js';
import defaultPackagesMobile from '../defaultPackagesMobile.js';

function createEmptyTypesMap() {
  return {
    actions: {},
    agents: {},
    auth: {
      adapters: {},
      providers: {},
      strategies: {},
    },
    blockMetas: {},
    connectionMetas: {},
    blocks: {},
    connections: {},
    icons: {},
    iconSets: {},
    notifications: {},
    operators: {
      client: {},
      server: {},
    },
    requestMetas: {},
    requests: {},
    steps: {},
    websockets: {},
  };
}

function getPackageVersion({ packageFile, packageName }) {
  return packageFile.devDependencies[packageName] || packageFile.dependencies[packageName];
}

// The per-target type classes of the native shell: blocks and actions from the
// native packages only, and the client operators of every default package.
function getMobilePackageTypes({ packageName, types }) {
  const packageTypes = {
    operators: { client: types.operators?.client ?? [] },
  };
  if (defaultPackagesMobile.blocks.includes(packageName)) {
    packageTypes.blocks = types.blocks;
    packageTypes.blockMetas = types.blockMetas;
    packageTypes.icons = types.icons;
  }
  if (defaultPackagesMobile.actions.includes(packageName)) {
    packageTypes.actions = types.actions;
  }
  return packageTypes;
}

async function generateDefaultTypesMapMobile({ packageFile }) {
  const typesMap = createEmptyTypesMap();
  const packageNames = [...new Set([...defaultPackages, ...defaultPackagesMobile.blocks])];
  for (const packageName of packageNames) {
    const { default: types } = await import(`${packageName}/types`);
    createPluginTypesMap({
      packageTypes: getMobilePackageTypes({ packageName, types }),
      typesMap,
      packageName,
      version: getPackageVersion({ packageFile, packageName }),
    });
  }
  const defaultTypesMapMobile = {
    actions: typesMap.actions,
    blockMetas: typesMap.blockMetas,
    blocks: typesMap.blocks,
    icons: typesMap.icons,
    operators: {
      client: typesMap.operators.client,
    },
  };

  await writeFile(
    path.resolve(process.cwd(), './dist/defaultTypesMapMobile.js'),
    `const defaultTypesMapMobile = ${JSON.stringify(defaultTypesMapMobile, null, 2)};

export default defaultTypesMapMobile;
`
  );
}

async function generateDefaultTypesMap() {
  const packageFile = JSON.parse(await readFile(path.resolve(process.cwd(), './package.json')));
  const defaultTypesMap = createEmptyTypesMap();

  for (const packageName of defaultPackages) {
    const { default: types } = await import(`${packageName}/types`);
    createPluginTypesMap({
      packageTypes: types,
      typesMap: defaultTypesMap,
      packageName,
      version: getPackageVersion({ packageFile, packageName }),
    });
  }

  await writeFile(
    path.resolve(process.cwd(), './dist/defaultTypesMap.js'),
    `const defaultTypesMap = ${JSON.stringify(defaultTypesMap, null, 2)};

export default defaultTypesMap;
`
  );

  await generateDefaultTypesMapMobile({ packageFile });
}

generateDefaultTypesMap();
