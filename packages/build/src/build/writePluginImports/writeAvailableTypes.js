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

import { FILE_PLUGIN_PACKAGE_ID } from '../filePlugins/discoverFilePlugins.js';

// A file plugin is never installed as a package — it is available because the
// file is there — so it is listed on its packageId, carrying the relative path
// the docs surfaces show instead of a package name.
function filterInstalled({ store, installedPackages }) {
  const filtered = {};
  for (const [typeName, definition] of Object.entries(store ?? {})) {
    if (
      definition.packageId === FILE_PLUGIN_PACKAGE_ID ||
      installedPackages.has(definition.package)
    ) {
      filtered[typeName] = definition;
    }
  }
  return filtered;
}

// Discovery artifact for the dev server docs routes: every type available
// from installed plugin packages, independent of whether the app config uses
// it. types.json only describes types counted in config (plus dev-installed
// blocks/actions/operators), so docs tooling needs this full map to list what
// a developer could use. Dev-only — context.installedPackages is set by the
// dev shallow build (addInstalledTypes); production builds skip it.
async function writeAvailableTypes({ context }) {
  const { typesMap, installedPackages } = context;
  if (!installedPackages) {
    return;
  }

  const availableTypes = {
    actions: filterInstalled({ store: typesMap.actions, installedPackages }),
    agents: filterInstalled({ store: typesMap.agents, installedPackages }),
    auth: {
      adapters: filterInstalled({ store: typesMap.auth.adapters, installedPackages }),
      callbacks: filterInstalled({ store: typesMap.auth.callbacks, installedPackages }),
      events: filterInstalled({ store: typesMap.auth.events, installedPackages }),
      providers: filterInstalled({ store: typesMap.auth.providers, installedPackages }),
      strategies: filterInstalled({ store: typesMap.auth.strategies, installedPackages }),
    },
    blocks: filterInstalled({ store: typesMap.blocks, installedPackages }),
    connections: filterInstalled({ store: typesMap.connections, installedPackages }),
    notifications: filterInstalled({ store: typesMap.notifications, installedPackages }),
    operators: {
      client: filterInstalled({ store: typesMap.operators.client, installedPackages }),
      server: filterInstalled({ store: typesMap.operators.server, installedPackages }),
    },
    requests: filterInstalled({ store: typesMap.requests, installedPackages }),
    websockets: filterInstalled({ store: typesMap.websockets, installedPackages }),
  };

  await context.writeBuildArtifact('plugins/availableTypes.json', JSON.stringify(availableTypes));
}

export default writeAvailableTypes;
