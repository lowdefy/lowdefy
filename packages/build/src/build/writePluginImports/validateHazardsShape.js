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

// A hazard is either a framework bug an agent has to work around, or a semantic an agent cannot
// infer from the schema. A bug names the task that retires it so the bug-hazard count can be
// counted down; a semantic is permanent. Both point at a doc page, because a hazard message is a
// summary and the reader needs somewhere to go.
export const HAZARD_KINDS = ['bug', 'semantics'];

const SHAPE = `{ id: string, message: string, kind: ${HAZARD_KINDS.map((kind) =>
  JSON.stringify(kind)
).join(' | ')}, retiredBy: string (required when kind is "bug"), see: string (a docs slug) }`;

function isNonEmptyString(value) {
  return type.isString(value) && value !== '';
}

function isHazard(value) {
  if (!type.isObject(value)) return false;
  if (!isNonEmptyString(value.id)) return false;
  if (!isNonEmptyString(value.message)) return false;
  if (!HAZARD_KINDS.includes(value.kind)) return false;
  if (value.kind === 'bug' && !isNonEmptyString(value.retiredBy)) return false;
  if (
    value.kind === 'semantics' &&
    !type.isNone(value.retiredBy) &&
    !isNonEmptyString(value.retiredBy)
  ) {
    return false;
  }
  return isNonEmptyString(value.see);
}

// Returns null when the hazards are well shaped, otherwise the message describing what is wrong.
// Pure, so both the block meta validator and the operator and request schema map writers report
// it against the type they are already naming.
function validateHazardsShape(hazards) {
  if (type.isUndefined(hazards)) {
    return null;
  }
  if (!type.isArray(hazards)) {
    return `hazards must be an array of ${SHAPE}. Received ${JSON.stringify(hazards)}.`;
  }
  const invalid = hazards.filter((hazard) => !isHazard(hazard));
  if (invalid.length === 0) {
    return null;
  }
  return `every hazard must be ${SHAPE}. Received ${JSON.stringify(invalid)}.`;
}

export default validateHazardsShape;
