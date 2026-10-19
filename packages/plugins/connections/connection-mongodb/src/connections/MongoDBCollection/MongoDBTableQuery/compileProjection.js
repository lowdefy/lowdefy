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

import isSafePath from '../MongoDBTableChanges/isSafePath.js';

// The rows a table receives hold only what the app allowed: `_id`, every field path, and the
// `returnFields` its cells read without a field of their own (an avatar's srcField, a link's
// labelField). A path inside another listed path is left to it, since $project refuses both.
function compileProjection({ fieldsByKey, returnFields }) {
  const extra = returnFields ?? [];
  if (!type.isArray(extra) || !extra.every(isSafePath)) {
    throw new Error(
      `MongoDBTableQuery "returnFields" should be an array of dot paths. Received ${JSON.stringify(
        returnFields
      )}.`
    );
  }
  const paths = [
    ...new Set(['_id', ...[...fieldsByKey.values()].map((field) => field.path), ...extra]),
  ];
  const kept = paths.filter((path) => !paths.some((other) => path.startsWith(`${other}.`)));
  return { $project: Object.fromEntries(kept.map((path) => [path, 1])) };
}

export default compileProjection;
