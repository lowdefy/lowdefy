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
  if (type.isNone(entry)) {
    return null;
  }
  const result = { kind: normalizedKind, type: typeName };
  if (normalizedKind === 'connections') {
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
  result.hazards = getHazards({ kind: normalizedKind, type: typeName });
  return result;
}

export default getSchema;
