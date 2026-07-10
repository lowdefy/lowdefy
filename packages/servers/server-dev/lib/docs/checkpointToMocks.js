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

import YAML from 'yaml';

import { readCheckpoint } from './checkpointStore.js';

// Errors can't round-trip through YAML as Error instances (and don't need
// to) — @lowdefy/e2e-utils' createMockManager accepts a plain string and
// wraps it itself (`error instanceof Error ? error : new Error(error)`), so
// only the message is kept here.
function toMockError(error) {
  if (!error) {
    return undefined;
  }
  return error.message ?? String(error);
}

function toMockEntries(entries, idKey, extraFields = {}) {
  return Object.entries(entries ?? {}).map(([id, entry]) => {
    const error = toMockError(entry?.error);
    const base = { [idKey]: id, ...extraFields };
    if (error) {
      return { ...base, error };
    }
    return { ...base, response: entry?.response ?? null };
  });
}

// Converts a state checkpoint's recorded requests/api responses into the
// exact shape @lowdefy/e2e-utils' loadStaticMocks/createMockManager expect
// (`{ requests: [...], api: [...] }`), so a checkpoint recorded from a live
// dev session can seed a future AI-generated (or hand-written) e2e test's
// mocks file directly.
function checkpointToMocks({ name }) {
  let checkpoint;
  try {
    checkpoint = readCheckpoint({ name });
  } catch (error) {
    return { error: error.message };
  }

  const pageId = checkpoint.checkpoint.pageId;
  const requests = toMockEntries(checkpoint.requests, 'requestId', { pageId });
  const api = toMockEntries(checkpoint.api, 'endpointId');

  const yamlContent = YAML.stringify({ requests, api });

  return { requests, api, yaml: yamlContent };
}

export default checkpointToMocks;
