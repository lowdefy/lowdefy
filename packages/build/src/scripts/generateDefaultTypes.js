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
import defaultPackagesMobile, { mobileBlockPackages } from '../defaultPackagesMobile.js';

function createEmptyTypesMap() {
  return {
    actions: {},
    agents: {},
    auth: {
      adapters: {},
      callbacks: {},
      events: {},
      providers: {},
    },
    blockMetas: {},
    blocks: {},
    connections: {},
    icons: {},
    notifications: {},
    operators: {
      client: {},
      server: {},
    },
    requests: {},
    websockets: {},
  };
}

async function generateTypesMap({ packageFile, packages, exportName, outFile, blockPackages }) {
  const typesMap = createEmptyTypesMap();

  for (const packageName of packages) {
    const { default: types } = await import(`${packageName}/types`);
    const version =
      packageFile.devDependencies[packageName] || packageFile.dependencies[packageName];
    let packageTypes = types;
    // When a block package allowlist is set, strip block types from other
    // packages — target-neutral packages (e.g. plugin-aws) can also ship
    // web-only blocks that must not resolve in mobile pages.
    if (blockPackages && !blockPackages.includes(packageName)) {
      const { blocks, blockMetas, icons, ...rest } = types;
      packageTypes = rest;
    }
    createPluginTypesMap({
      packageTypes,
      typesMap,
      packageName,
      version,
    });
  }

  await writeFile(
    path.resolve(process.cwd(), outFile),
    `const ${exportName} = ${JSON.stringify(typesMap, null, 2)};

export default ${exportName};
`
  );
}

async function generateDefaultTypesMap() {
  const packageFile = JSON.parse(await readFile(path.resolve(process.cwd(), './package.json')));
  await generateTypesMap({
    packageFile,
    packages: defaultPackages,
    exportName: 'defaultTypesMap',
    outFile: './dist/defaultTypesMap.js',
  });
  await generateTypesMap({
    packageFile,
    packages: defaultPackagesMobile,
    exportName: 'defaultTypesMapMobile',
    outFile: './dist/defaultTypesMapMobile.js',
    blockPackages: mobileBlockPackages,
  });
}

generateDefaultTypesMap();
