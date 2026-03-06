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

function collectMissing({ counter, definitions, installedPluginPackages, missingPackages }) {
  const counts = counter.getCounts();
  for (const typeName of Object.keys(counts)) {
    const def = definitions[typeName];
    if (!def) continue;
    if (installedPluginPackages.has(def.package)) continue;

    if (!missingPackages.has(def.package)) {
      missingPackages.set(def.package, { version: def.version, types: [] });
    }
    missingPackages.get(def.package).types.push(typeName);
  }
}

function detectMissingPluginPackages({ context, installedPluginPackages }) {
  const missingPackages = new Map();

  if (!installedPluginPackages) {
    return missingPackages;
  }

  const { typeCounters, typesMap } = context;

  collectMissing({
    counter: typeCounters.blocks,
    definitions: typesMap.blocks,
    installedPluginPackages,
    missingPackages,
  });

  collectMissing({
    counter: typeCounters.actions,
    definitions: typesMap.actions,
    installedPluginPackages,
    missingPackages,
  });

  collectMissing({
    counter: typeCounters.operators.client,
    definitions: typesMap.operators.client,
    installedPluginPackages,
    missingPackages,
  });

  collectMissing({
    counter: typeCounters.operators.server,
    definitions: typesMap.operators.server,
    installedPluginPackages,
    missingPackages,
  });

  return missingPackages;
}

export default detectMissingPluginPackages;
