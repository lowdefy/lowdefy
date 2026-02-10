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
import { get } from '@lowdefy/helpers';
import { readFile } from '@lowdefy/node-utils';
import { createPluginTypesMap } from '@lowdefy/build';
import YAML from 'yaml';

async function getPluginDefinitions({ directories }) {
  let lowdefyYaml = await readFile(path.join(directories.config, 'lowdefy.yaml'));
  if (!lowdefyYaml) {
    lowdefyYaml = await readFile(path.join(directories.config, 'lowdefy.yml'));
  }
  const lowdefy = YAML.parse(lowdefyYaml);
  return get(lowdefy, 'plugins', { default: [] });
}

async function createCustomPluginTypesMap({ directories, logger }) {
  const customTypesMap = {
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
    schemas: {
      actions: {},
      blocks: {},
      operators: {},
    },
    styles: {
      packages: {},
      blocks: {},
    },
  };

  const pluginDefinitions = await getPluginDefinitions({ directories });

  for (const plugin of pluginDefinitions) {
    let types;
    try {
      types = (await import(`${plugin.name}/types`)).default;
    } catch (e) {
      logger.error(`Failed to import plugin "${plugin.name}".`);
      logger.debug(e);
      logger.info('If the plugin was added while the server was running, restart the server.');
      throw new Error(`Failed to import plugin "${plugin.name}".`);
    }
    createPluginTypesMap({
      packageTypes: types,
      typesMap: customTypesMap,
      packageName: plugin.name,
      version: plugin.version,
      typePrefix: plugin.typePrefix,
    });

    // Import schemas from the plugin (build package can't resolve custom plugins)
    try {
      const packageSchemas = await import(`${plugin.name}/schemas`);
      for (const [typeName, schema] of Object.entries(packageSchemas)) {
        if (typeName === 'default') continue;
        const prefixedName = `${plugin.typePrefix ?? ''}${typeName}`;
        if (customTypesMap.actions[prefixedName]) {
          customTypesMap.schemas.actions[prefixedName] = schema;
        } else {
          customTypesMap.schemas.blocks[prefixedName] = schema;
        }
      }
    } catch {
      // Package doesn't export schemas — skip
    }
  }

  return customTypesMap;
}

export default createCustomPluginTypesMap;
