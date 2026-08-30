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
import { ConfigError } from '@lowdefy/errors';

import runRoutine from '../endpoints/runRoutine.js';

const COUNT_KEYS = [
  'modifiedCount',
  'insertedCount',
  'upsertedCount',
  'matchedCount',
  'deletedCount',
];

// Sums the documents a migration touched from its step results, so the runner
// can report "9,812 documents". A MongoDB* write result carries one of these
// counts; a step that returns something else contributes nothing.
function countDocuments(steps) {
  let total = 0;
  Object.values(steps ?? {}).forEach((result) => {
    if (!type.isObject(result)) return;
    COUNT_KEYS.forEach((key) => {
      if (type.isInt(result[key])) {
        total += result[key];
      }
    });
  });
  return total;
}

// Runs one migration's routine on the (already trusted, caller-less) system
// context. The routine was validated and stamped at build; this reads the
// per-migration artifact and dispatches it exactly as an endpoint routine is
// dispatched (design D1, D6). Returns { status, error, documents }.
async function runMigrationRoutine(context, { id }) {
  // readConfigFile deserializes .json artifacts (serializer markers → arrays,
  // Dates), so the artifact is already an object; no second deserialize.
  const artifact = await context.readConfigFile(`migrations/${id}.json`);
  if (type.isNone(artifact)) {
    throw new ConfigError(
      `Migration artifact "migrations/${id}.json" not found. Run "lowdefy build" before migrating.`
    );
  }
  const { routine } = artifact;
  const routineContext = {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    state: {},
    endpointDepth: 0,
  };
  const { status, error } = await runRoutine(context, routineContext, { routine });
  return { status, error, documents: countDocuments(routineContext.steps) };
}

export { countDocuments };
export default runMigrationRoutine;
