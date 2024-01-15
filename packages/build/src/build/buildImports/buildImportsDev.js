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

import buildIconImports from './buildIconImports.js';
import buildStyleImports from './buildStyleImports.js';
import defaultIconsDev from './defaultIconsDev.js';

function getPluginPackages({ components }) {
  const pluginPackages = new Set();

  function getPackages(types) {
    Object.values(types).forEach((type) => {
      pluginPackages.add(type.package);
    });
  }
  getPackages(components.types.actions);
  getPackages(components.types.auth.adapters);
  getPackages(components.types.auth.callbacks);
  getPackages(components.types.auth.events);
  getPackages(components.types.auth.providers);
  getPackages(components.types.blocks);
  getPackages(components.types.connections);
  getPackages(components.types.requests);
  getPackages(components.types.operators.client);
  getPackages(components.types.operators.server);
  return pluginPackages;
}

function buildImportClassDev({ pluginPackages, map }) {
  return Object.entries(map)
    .map(([typeName, type]) => ({
      originalTypeName: type.originalTypeName,
      package: type.package,
      typeName,
    }))
    .filter((type) => pluginPackages.has(type.package));
}

function buildImportsDev({ components, context }) {
  const pluginPackages = getPluginPackages({ components });
  const blocks = buildImportClassDev({ pluginPackages, map: context.typesMap.blocks });
  return {
    actions: buildImportClassDev({ pluginPackages, map: context.typesMap.actions }),
    auth: {
      adapters: buildImportClassDev({ pluginPackages, map: context.typesMap.auth.adapters }),
      callbacks: buildImportClassDev({ pluginPackages, map: context.typesMap.auth.callbacks }),
      events: buildImportClassDev({ pluginPackages, map: context.typesMap.auth.events }),
      providers: buildImportClassDev({ pluginPackages, map: context.typesMap.auth.providers }),
    },
    blocks,
    connections: buildImportClassDev({ pluginPackages, map: context.typesMap.connections }),
    icons: buildIconImports({ blocks, components, context, defaults: defaultIconsDev }),
    requests: buildImportClassDev({ pluginPackages, map: context.typesMap.requests }),
    operators: {
      client: buildImportClassDev({ pluginPackages, map: context.typesMap.operators.client }),
      server: buildImportClassDev({ pluginPackages, map: context.typesMap.operators.server }),
    },
    styles: buildStyleImports({ blocks, context }),
  };
}

export default buildImportsDev;
