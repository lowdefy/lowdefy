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

import getDocsIndex from './getDocsIndex.js';
import normalizeTypeKind from './normalizeTypeKind.js';
import readBuildArtifact from './readBuildArtifact.js';

function usedTypeNames({ store }) {
  const used = new Set();
  for (const [typeName, definition] of Object.entries(store ?? {})) {
    if (type.isObject(definition) && (definition.count ?? 0) > 0) {
      used.add(typeName);
    }
  }
  return used;
}

const TARGETS = ['web', 'mobile'];

// The kinds a native shell draws or runs itself. Every other kind (connections,
// requests, server operators, agents, ...) runs on the app's server, the same
// for a phone as for a browser.
const SHELL_KINDS = ['blocks', 'actions'];

function flattenKind({ kind, availableTypes, clientOperators }) {
  if (kind === 'operators') {
    const merged = {};
    for (const [typeName, definition] of Object.entries(
      clientOperators ?? availableTypes.operators?.client ?? {}
    )) {
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

// The types of a kind a target can use. For `mobile`, blocks, actions and
// client operators are the ones a native shell carries
// (plugins/availableTypesMobile.json), not the app's installed web plugins.
function availableForTarget({ kind, target, availableTypes, availableTypesMobile }) {
  if (target !== 'mobile') {
    return { definitions: flattenKind({ kind, availableTypes }), fromShell: false };
  }
  if (SHELL_KINDS.includes(kind)) {
    return { definitions: availableTypesMobile[kind] ?? {}, fromShell: true };
  }
  if (kind === 'operators') {
    return {
      definitions: flattenKind({
        kind,
        availableTypes,
        clientOperators: availableTypesMobile.operators?.client ?? {},
      }),
      fromShell: true,
    };
  }
  return { definitions: flattenKind({ kind, availableTypes }), fromShell: false };
}

function listTypes({ kind, target }) {
  const normalizedKind = normalizeTypeKind({ kind });
  if (type.isNone(normalizedKind)) {
    throw new Error(
      `Unknown type kind. Received ${JSON.stringify(
        kind
      )}. Use one of: blocks, operators, actions, connections, requests, agents, notifications, websockets.`
    );
  }
  if (!type.isNone(target) && !TARGETS.includes(target)) {
    throw new Error(`Unknown target. Received ${JSON.stringify(target)}. Use "web" or "mobile".`);
  }
  const availableTypes = readBuildArtifact({ name: 'plugins/availableTypes.json' }) ?? {};
  const availableTypesMobile =
    readBuildArtifact({ name: 'plugins/availableTypesMobile.json' }) ?? {};
  const types = readBuildArtifact({ name: 'types.json', deserialize: true }) ?? {};
  const webBlockMetas = readBuildArtifact({ name: 'plugins/blockMetas.json' }) ?? {};
  const { entries, typeDocs } = getDocsIndex();

  const docSlugsByType = new Map();
  const kindSingular = normalizedKind.slice(0, -1);
  for (const entry of entries) {
    if (entry.source === 'core' && entry.kind === kindSingular && entry.typeName) {
      docSlugsByType.set(entry.typeName, entry.slug);
    }
  }
  for (const [key, slug] of typeDocs) {
    const separator = key.indexOf(':');
    if (key.slice(0, separator) === kindSingular) {
      docSlugsByType.set(key.slice(separator + 1), slug);
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

  const { definitions, fromShell } = availableForTarget({
    kind: normalizedKind,
    target,
    availableTypes,
    availableTypesMobile,
  });
  const blockMetas = fromShell ? availableTypesMobile.blockMetas ?? {} : webBlockMetas;
  const webDefinitions = flattenKind({ kind: normalizedKind, availableTypes });
  return Object.entries(definitions)
    .map(([typeName, definition]) => {
      const entry = {
        type: typeName,
        kind: normalizedKind,
        package: definition.package,
        version: definition.version,
      };
      // types.json counts what web pages use, so it says nothing of a shell's types.
      if (!fromShell) {
        entry.used = used.has(typeName);
      }
      if (definition.environments) {
        entry.environments = definition.environments;
      }
      if (normalizedKind === 'blocks' && blockMetas[typeName]?.category) {
        entry.category = blockMetas[typeName].category;
      }
      // A shell type documented by its web page only when it is the same package's type: a
      // native Button is not the web one.
      const sameAsWeb = webDefinitions[typeName]?.package === definition.package;
      if (docSlugsByType.has(typeName) && (!fromShell || sameAsWeb)) {
        entry.docSlug = docSlugsByType.get(typeName);
      }
      return entry;
    })
    .sort((a, b) => a.type.localeCompare(b.type));
}

export default listTypes;
