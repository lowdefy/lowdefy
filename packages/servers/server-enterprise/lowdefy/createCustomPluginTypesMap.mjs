#!/usr/bin/env node
/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
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

async function createCustomPluginTypesMap({ directories }) {
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
    styles: {
      packages: {},
      blocks: {},
    },
  };

  const pluginDefinitions = await getPluginDefinitions({ directories });

  for (const plugin of pluginDefinitions) {
    const { default: types } = await import(`${plugin.name}/types`);
    createPluginTypesMap({
      packageTypes: types,
      typesMap: customTypesMap,
      packageName: plugin.name,
      version: plugin.version,
      typePrefix: plugin.typePrefix,
    });
  }

  return customTypesMap;
}

export default createCustomPluginTypesMap;
