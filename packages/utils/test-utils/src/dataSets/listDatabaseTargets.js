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

import describeTargetKey from './describeTargetKey.js';

// Sorts a URI's default database (no databaseName) before its named ones.
function sortKey(key) {
  const [uri, databaseName] = JSON.parse(key);
  return [uri, databaseName ?? ''].join('\u0000');
}

// Every database target the built connections name, sorted, so each run numbers them alike and the
// first one (the database a computed target reads) is the same on every run.
function listDatabaseTargets({ artifacts }) {
  const keys = new Set();
  Object.values(artifacts).forEach((artifact) => {
    const key = describeTargetKey({ properties: artifact.properties });
    if (!type.isNone(key)) keys.add(key);
  });
  return [...keys].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

export default listDatabaseTargets;
