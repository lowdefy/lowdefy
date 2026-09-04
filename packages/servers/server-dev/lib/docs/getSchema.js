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

import { VALID_CHECK_SLUGS } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import getHazards from './getHazards.js';
import normalizeTypeKind from './normalizeTypeKind.js';
import readBuildArtifact from './readBuildArtifact.js';

const SCHEMA_ARTIFACTS = {
  actions: 'plugins/actionSchemas.json',
  blocks: 'plugins/blockSchemas.json',
  connections: 'plugins/connectionSchemas.json',
  operators: 'plugins/operatorSchemas.json',
  requests: 'plugins/requestSchemas.json',
};

// The synthetic package identity discoverFilePlugins gives a plugin that is a
// file in the config directory rather than an installed package.
const FILE_PLUGIN_PACKAGE_ID = 'file-plugin';

// A file plugin's schema and meta come from its sibling JSON, which the build
// has already written into the same schema maps a package plugin's do. Only
// the source needs naming, so an agent knows which file to edit.
function filePluginDefinition({ kind, typeName }) {
  const availableTypes = readBuildArtifact({ name: 'plugins/availableTypes.json' }) ?? {};
  const stores =
    kind === 'operators'
      ? [availableTypes.operators?.client, availableTypes.operators?.server]
      : [availableTypes[kind]];
  for (const store of stores) {
    const definition = store?.[typeName];
    if (definition?.packageId === FILE_PLUGIN_PACKAGE_ID) {
      return definition;
    }
  }
  return null;
}

// An agent has no other way to learn a legal ~ignoreBuildChecks slug: the key
// is stripped before the JSON schema runs, so the build's own error message was
// the only source. Serve the catalogue here instead.
function getCheckSlugs({ typeName }) {
  if (type.isNone(typeName) || typeName === '~ignoreBuildChecks' || typeName === 'all') {
    return {
      kind: 'checks',
      type: '~ignoreBuildChecks',
      description:
        'Build checks that ~ignoreBuildChecks can suppress. Write them as an array on the config node the check reports on, or on any of its ancestors: "~ignoreBuildChecks: [state-refs]". Suppression covers build-time validation only - the runtime behaviour is unchanged.',
      slugs: Object.entries(VALID_CHECK_SLUGS).map(([slug, slugDescription]) => ({
        slug,
        description: slugDescription,
      })),
    };
  }
  if (type.isNone(VALID_CHECK_SLUGS[typeName])) {
    return null;
  }
  return {
    kind: 'checks',
    type: typeName,
    slug: typeName,
    description: VALID_CHECK_SLUGS[typeName],
  };
}

function getSchema({ kind, type: typeName }) {
  if (String(kind ?? '').toLowerCase() === 'checks') {
    return getCheckSlugs({ typeName });
  }
  const normalizedKind = normalizeTypeKind({ kind });
  if (type.isNone(SCHEMA_ARTIFACTS[normalizedKind])) {
    throw new Error(
      `No schemas available for type kind. Received ${JSON.stringify(
        kind
      )}. Use one of: blocks, operators, actions, connections, requests, checks.`
    );
  }
  const schemas = readBuildArtifact({ name: SCHEMA_ARTIFACTS[normalizedKind] }) ?? {};
  const entry = schemas[typeName];
  const filePlugin = filePluginDefinition({ kind: normalizedKind, typeName });
  // A file action or operator may ship no sibling JSON at all, and is then a
  // real type with no schema - saying so beats a "no such type" answer.
  if (type.isNone(entry) && type.isNone(filePlugin)) {
    return null;
  }
  const result = { kind: normalizedKind, type: typeName };
  if (type.isNone(entry)) {
    result.schema = null;
  } else if (normalizedKind === 'connections') {
    result.schema = entry.schema ?? entry;
    if (entry.requests) {
      result.requests = entry.requests;
    }
  } else if (normalizedKind === 'requests') {
    result.schema = entry.schema ?? entry;
    if (entry.meta) {
      result.meta = entry.meta;
    }
  } else {
    result.schema = entry;
  }
  if (normalizedKind === 'blocks') {
    const blockMetas = readBuildArtifact({ name: 'plugins/blockMetas.json' }) ?? {};
    if (blockMetas[typeName]) {
      result.meta = blockMetas[typeName];
    }
  }
  if (!type.isNone(filePlugin)) {
    result.source = 'file plugin';
    result.file = filePlugin.relativePath;
    if (!type.isNone(filePlugin.meta)) {
      result.meta = filePlugin.meta;
    }
  }
  result.hazards = getHazards({ kind: normalizedKind, type: typeName });
  return result;
}

export default getSchema;
