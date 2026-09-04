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

import readBuildArtifact from './readBuildArtifact.js';

function addTypes({ plugins, store, kind }) {
  for (const [typeName, definition] of Object.entries(store ?? {})) {
    if (!plugins[definition.package]) {
      plugins[definition.package] = {
        package: definition.package,
        version: definition.version,
        types: {},
      };
    }
    const plugin = plugins[definition.package];
    if (!plugin.types[kind]) {
      plugin.types[kind] = [];
    }
    plugin.types[kind].push(typeName);
  }
}

function listPlugins() {
  const availableTypes = readBuildArtifact({ name: 'plugins/availableTypes.json' }) ?? {};
  const customTypesMap = readBuildArtifact({ name: 'customTypesMap.json' }) ?? {};
  const installedPackages = readBuildArtifact({ name: 'installedPluginPackages.json' }) ?? [];

  const plugins = {};
  addTypes({ plugins, store: availableTypes.actions, kind: 'actions' });
  addTypes({ plugins, store: availableTypes.agents, kind: 'agents' });
  addTypes({ plugins, store: availableTypes.blocks, kind: 'blocks' });
  addTypes({ plugins, store: availableTypes.connections, kind: 'connections' });
  addTypes({ plugins, store: availableTypes.notifications, kind: 'notifications' });
  addTypes({ plugins, store: availableTypes.operators?.client, kind: 'operators' });
  addTypes({ plugins, store: availableTypes.operators?.server, kind: 'operators' });
  addTypes({ plugins, store: availableTypes.requests, kind: 'requests' });
  addTypes({ plugins, store: availableTypes.websockets, kind: 'websockets' });

  const customPackages = new Set();
  const customStores = [
    customTypesMap.actions,
    customTypesMap.agents,
    customTypesMap.blocks,
    customTypesMap.connections,
    customTypesMap.operators?.client,
    customTypesMap.operators?.server,
    customTypesMap.requests,
    customTypesMap.websockets,
  ];
  for (const store of customStores) {
    for (const definition of Object.values(store ?? {})) {
      customPackages.add(definition.package);
    }
  }

  return Object.values(plugins)
    .map((plugin) => ({
      ...plugin,
      custom: customPackages.has(plugin.package),
      installed: installedPackages.includes(plugin.package),
      types: Object.fromEntries(
        Object.entries(plugin.types).map(([kind, typeNames]) => [
          kind,
          [...new Set(typeNames)].sort(),
        ])
      ),
    }))
    .sort((a, b) => a.package.localeCompare(b.package));
}

export default listPlugins;
