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

import { createRequire } from 'node:module';
import path from 'path';
import { collectPluginDefinitions, hasTypesExport, readFile } from '@lowdefy/node-utils';
import { createPluginTypesMap, createPluginTypesMapMobile } from '@lowdefy/build';
import YAML from 'yaml';

const require = createRequire(import.meta.url);

async function getPluginDefinitions({ directories }) {
  let lowdefyYaml = await readFile(path.join(directories.config, 'lowdefy.yaml'));
  if (!lowdefyYaml) {
    lowdefyYaml = await readFile(path.join(directories.config, 'lowdefy.yml'));
  }
  if (!lowdefyYaml) {
    return { plugins: [], shellPlugins: [] };
  }
  return collectPluginDefinitions({ lowdefy: YAML.parse(lowdefyYaml) });
}

// A plugin only shells list may be native-only, with no ./types export: it
// adds no types. Root plugins must export ./types.
function readPluginTypes({ plugin }) {
  if (plugin.shellOnly && !hasTypesExport({ name: plugin.name, require })) {
    return {};
  }
  const types = require(`${plugin.name}/types`);
  return types.default ?? types;
}

async function createCustomPluginTypesMap({ directories }) {
  const customTypesMap = {
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
    operators: {
      client: {},
      server: {},
    },
    requests: {},
    websockets: {},
  };

  const { plugins, shellPlugins } = await getPluginDefinitions({ directories });
  const customTypesMapMobile = {
    actions: {},
    blockMetas: {},
    blocks: {},
    icons: {},
    operators: {
      client: {},
    },
    plugins: shellPlugins.map((plugin) => plugin.name),
  };

  const packageTypes = new Map();
  for (const plugin of plugins) {
    packageTypes.set(plugin.name, readPluginTypes({ plugin }));
    createPluginTypesMap({
      packageTypes: packageTypes.get(plugin.name),
      typesMap: customTypesMap,
      packageName: plugin.name,
      version: plugin.version,
      typePrefix: plugin.typePrefix,
    });
  }
  for (const plugin of shellPlugins) {
    createPluginTypesMapMobile({
      packageTypes: packageTypes.get(plugin.name),
      typesMap: customTypesMapMobile,
      packageName: plugin.name,
      version: plugin.version,
      typePrefix: plugin.typePrefix,
    });
  }

  return { customTypesMap, customTypesMapMobile };
}

export default createCustomPluginTypesMap;
