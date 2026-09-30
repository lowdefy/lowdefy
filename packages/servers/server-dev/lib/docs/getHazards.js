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

import loadFrameworkHazards from './loadFrameworkHazards.js';
import normalizeTypeKind from './normalizeTypeKind.js';
import readBuildArtifact from './readBuildArtifact.js';

// Where each kind's plugin-declared hazards land in the build: block metas
// pick them from meta.hazards, request metas ride along whole, operators
// get a dedicated metas artifact (they carry no other meta).
const TYPE_ATTACHED_HAZARDS = {
  blocks: (typeName) => readBuildArtifact({ name: 'plugins/blockMetas.json' })?.[typeName]?.hazards,
  operators: (typeName) =>
    readBuildArtifact({ name: 'plugins/operatorMetas.json' })?.[typeName]?.hazards,
  requests: (typeName) =>
    readBuildArtifact({ name: 'plugins/requestSchemas.json' })?.[typeName]?.meta?.hazards,
};

// The closed set of `when` conditions a framework hazard may declare. A
// hazard whose `when` is not here is skipped with a warning rather than
// guessed at — an agent must be able to rely on every hazard it is shown.
const WHEN_CONDITIONS = {
  connectionTenantNotNone: ({ kind, connectionId }) => {
    if (kind !== 'requests' || type.isNone(connectionId)) {
      return false;
    }
    const tenantConnections = readBuildArtifact({ name: 'tenantConnections.json' }) ?? [];
    return tenantConnections.some((connection) => connection.connectionId === connectionId);
  },
};

const warnedUnknownWhen = new Set();

function normalizeKind(kind) {
  if (type.isNone(kind)) {
    return null;
  }
  const lowered = String(kind).toLowerCase();
  if (lowered === 'page' || lowered === 'pages') {
    return 'pages';
  }
  return normalizeTypeKind({ kind: lowered });
}

function hazardApplies({ hazard, kind, typeName, connectionId }) {
  const { kinds, types, when } = hazard.appliesTo ?? {};
  if (type.isNone(kinds) && type.isNone(types)) {
    return false;
  }
  if (!type.isNone(kinds) && !kinds.includes(kind)) {
    return false;
  }
  if (!type.isNone(types) && !types.includes(typeName)) {
    return false;
  }
  if (type.isNone(when)) {
    return true;
  }
  const condition = WHEN_CONDITIONS[when];
  if (type.isNone(condition)) {
    if (!warnedUnknownWhen.has(when)) {
      warnedUnknownWhen.add(when);
      console.warn(
        `Hazard "${hazard.id}" declares unknown when condition ${JSON.stringify(
          when
        )} and was skipped.`
      );
    }
    return false;
  }
  return condition({ kind, connectionId });
}

// Hazards for a type: the plugin's own (meta.hazards, via the build
// artifacts) first, then the framework-level list filtered by kind/type and
// its `when` condition, de-duplicated by id.
function getHazards({ kind, type: typeName, connectionId }) {
  const normalizedKind = normalizeKind(kind);
  const hazards = [];
  const seen = new Set();
  const push = (hazard) => {
    if (type.isNone(hazard?.id) || seen.has(hazard.id)) {
      return;
    }
    seen.add(hazard.id);
    hazards.push({ id: hazard.id, message: hazard.message, see: hazard.see ?? null });
  };

  const readTypeAttached = TYPE_ATTACHED_HAZARDS[normalizedKind];
  if (!type.isNone(readTypeAttached) && !type.isNone(typeName)) {
    (readTypeAttached(typeName) ?? []).forEach(push);
  }

  (loadFrameworkHazards() ?? [])
    .filter((hazard) => hazardApplies({ hazard, kind: normalizedKind, typeName, connectionId }))
    .forEach(push);

  return hazards;
}

export default getHazards;
