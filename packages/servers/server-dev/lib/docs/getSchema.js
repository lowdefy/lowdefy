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
import { JOURNEY_STEP_SCHEMAS, journeyStepSchema } from '@lowdefy/node-utils';

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

const JOURNEY_STEP_KINDS = ['journey-step', 'journey-steps'];

// kind journey-step returns the journey step grammar: every step, or the one
// step `type` names.
function getJourneyStepSchema({ typeName }) {
  if (type.isNone(typeName) || typeName === '' || typeName === 'all') {
    return { kind: 'journey-step', schema: journeyStepSchema };
  }
  const schema = JOURNEY_STEP_SCHEMAS[typeName];
  if (type.isNone(schema)) {
    return null;
  }
  return { kind: 'journey-step', type: typeName, schema };
}

function getSchema({ kind, type: typeName }) {
  if (JOURNEY_STEP_KINDS.includes(String(kind ?? '').toLowerCase())) {
    return getJourneyStepSchema({ typeName });
  }
  const normalizedKind = normalizeTypeKind({ kind });
  if (type.isNone(SCHEMA_ARTIFACTS[normalizedKind])) {
    throw new Error(
      `No schemas available for type kind. Received ${JSON.stringify(
        kind
      )}. Use one of: blocks, operators, actions, connections, requests, or journey-step for the journey step grammar.`
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
