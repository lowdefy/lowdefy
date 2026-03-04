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

import fs from 'fs';
import path from 'path';

function getInstalledPackages(directories) {
  if (!directories.server) return null;
  const pkgPath = path.join(directories.server, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return new Set(Object.keys(pkg.dependencies ?? {}));
}

// In dev mode, page content is built JIT so page-level types (actions, blocks,
// operators) aren't counted during skeleton build. Include all types from
// installed packages so they're available for client-side use. Dev server
// pre-installs default packages so bundle size is not a concern — only
// production builds tree-shake by counting exact type usage.
function addInstalledTypes({ components, context }) {
  const installedPackages = getInstalledPackages(context.directories);
  if (!installedPackages) return;

  const addTypes = (store, definitions) => {
    for (const [typeName, def] of Object.entries(definitions)) {
      if (!store[typeName] && installedPackages.has(def.package)) {
        store[typeName] = {
          originalTypeName: def.originalTypeName,
          package: def.package,
          version: def.version,
          count: 0,
        };
      }
    }
  };
  addTypes(components.types.actions, context.typesMap.actions);
  addTypes(components.types.blocks, context.typesMap.blocks);
  addTypes(components.types.operators.client, context.typesMap.operators.client);
  addTypes(components.types.operators.server, context.typesMap.operators.server);

  // Expose installedPackages on context for later use (e.g., writing build artifact)
  context.installedPackages = installedPackages;
}

export default addInstalledTypes;
