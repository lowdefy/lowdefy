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

function getSchema({ kind, type: typeName }) {
  const normalizedKind = normalizeTypeKind({ kind });
  if (type.isNone(SCHEMA_ARTIFACTS[normalizedKind])) {
    throw new Error(
      `No schemas available for type kind. Received ${JSON.stringify(
        kind
      )}. Use one of: blocks, operators, actions, connections, requests.`
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
