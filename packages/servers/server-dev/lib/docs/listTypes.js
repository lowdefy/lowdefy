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

import { type } from '@lowdefy/helpers';

import getDocsManifest from './getDocsManifest.js';
import normalizeTypeKind from './normalizeTypeKind.js';
import readBuildArtifact from './readBuildArtifact.js';

// The synthetic package identity discoverFilePlugins gives a plugin that is a
// file in the config directory rather than an installed package.
const FILE_PLUGIN_PACKAGE_ID = 'file-plugin';

function usedTypeNames({ store }) {
  const used = new Set();
  for (const [typeName, definition] of Object.entries(store ?? {})) {
    if (type.isObject(definition) && (definition.count ?? 0) > 0) {
      used.add(typeName);
    }
  }
  return used;
}

function flattenKind({ kind, availableTypes }) {
  if (kind === 'operators') {
    const merged = {};
    for (const [typeName, definition] of Object.entries(availableTypes.operators?.client ?? {})) {
      merged[typeName] = { ...definition, environments: ['client'] };
    }
    for (const [typeName, definition] of Object.entries(availableTypes.operators?.server ?? {})) {
      if (merged[typeName]) {
        merged[typeName].environments.push('server');
      } else {
        merged[typeName] = { ...definition, environments: ['server'] };
      }
    }
    return merged;
  }
  return availableTypes[kind] ?? {};
}

function listTypes({ kind }) {
  const normalizedKind = normalizeTypeKind({ kind });
  if (type.isNone(normalizedKind)) {
    throw new Error(
      `Unknown type kind. Received ${JSON.stringify(
        kind
      )}. Use one of: blocks, operators, actions, connections, requests, agents, notifications, websockets.`
    );
  }
  const availableTypes = readBuildArtifact({ name: 'plugins/availableTypes.json' }) ?? {};
  const types = readBuildArtifact({ name: 'types.json', deserialize: true }) ?? {};
  const blockMetas = readBuildArtifact({ name: 'plugins/blockMetas.json' }) ?? {};
  const manifest = getDocsManifest();

  const docSlugsByType = new Map();
  const kindSingular = normalizedKind.slice(0, -1);
  for (const doc of manifest?.docs ?? []) {
    if (doc.kind === kindSingular && doc.typeName) {
      docSlugsByType.set(doc.typeName, doc.slug);
    }
  }

  let used;
  if (normalizedKind === 'operators') {
    used = new Set([
      ...usedTypeNames({ store: types.operators?.client }),
      ...usedTypeNames({ store: types.operators?.server }),
    ]);
  } else {
    used = usedTypeNames({ store: types[normalizedKind] });
  }

  const flattened = flattenKind({ kind: normalizedKind, availableTypes });
  return Object.entries(flattened)
    .map(([typeName, definition]) => {
      const entry = {
        type: typeName,
        kind: normalizedKind,
        package: definition.package,
        version: definition.version,
        used: used.has(typeName),
      };
      if (definition.packageId === FILE_PLUGIN_PACKAGE_ID) {
        entry.source = 'file plugin';
        entry.file = definition.relativePath;
      }
      if (definition.environments) {
        entry.environments = definition.environments;
      }
      if (normalizedKind === 'blocks' && blockMetas[typeName]?.category) {
        entry.category = blockMetas[typeName].category;
      }
      if (docSlugsByType.has(typeName)) {
        entry.docSlug = docSlugsByType.get(typeName);
      }
      return entry;
    })
    .sort((a, b) => a.type.localeCompare(b.type));
}

export default listTypes;
