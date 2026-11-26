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

import createDefaultTypesMap from '../utils/createDefaultTypesMap.js';
import createEmptyTypesMap from '../utils/createEmptyTypesMap.js';
import createPluginTypesMap from '../utils/createPluginTypesMap.js';
import getPackageVersion from '../utils/getPackageVersion.js';
import defaultPackages from '../defaultPackages.js';
import defaultPackagesMobile from '../defaultPackagesMobile.js';
import nativeBlockTypes from '../nativeBlockTypes.js';

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

// The native block packages' types are committed (src/nativeBlockTypes.js) rather than imported,
// so build does not depend on them: blocks-native depends on client-native, which depends on
// engine, whose tests depend on build. All @lowdefy packages share one version.
const nativeBlockPackageTypes = {
  '@lowdefy/blocks-native': nativeBlockTypes,
};

async function getTypes({ packageFile, packageName }) {
  if (nativeBlockPackageTypes[packageName]) {
    return { types: nativeBlockPackageTypes[packageName], version: packageFile.version };
  }
  const { default: types } = await import(`${packageName}/types`);
  return { types, version: getPackageVersion({ packageFile, packageName }) };
}

async function generateDefaultTypesMapMobile({ packageFile }) {
  const typesMap = createEmptyTypesMap();
  const packageNames = [...new Set([...defaultPackages, ...defaultPackagesMobile.blocks])];
  for (const packageName of packageNames) {
    const { types, version } = await getTypes({ packageFile, packageName });
    createPluginTypesMap({
      packageTypes: getMobilePackageTypes({ packageName, types }),
      typesMap,
      packageName,
      version,
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
    // Shell plugins add their package names (createCustomPluginTypesMap).
    plugins: [],
  };

  await writeFile(
    path.resolve(process.cwd(), './dist/defaultTypesMapMobile.js'),
    `const defaultTypesMapMobile = ${JSON.stringify(defaultTypesMapMobile, null, 2)};

export default defaultTypesMapMobile;
`
  );
}

// The web types map, with the default packages' schemas (createDefaultTypesMap).
// Its scope is defaultPackages: defaultPackagesMobile adds only
// @lowdefy/blocks-native, which build cannot import (see nativeBlockPackageTypes),
// and whose types never enter the web typesMap that the schema checks and the
// plugins/*Schemas.json maps read.
async function generateDefaultTypesMap() {
  const packageFile = JSON.parse(await readFile(path.resolve(process.cwd(), './package.json')));
  const defaultTypesMap = await createDefaultTypesMap({
    packageFile,
    packageNames: defaultPackages,
  });

  await writeFile(
    path.resolve(process.cwd(), './dist/defaultTypesMap.js'),
    `const defaultTypesMap = ${JSON.stringify(defaultTypesMap, null, 2)};

export default defaultTypesMap;
`
  );

  await generateDefaultTypesMapMobile({ packageFile });
}

await generateDefaultTypesMap();
