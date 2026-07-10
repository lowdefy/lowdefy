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

import { buildPageUrl } from './getBrowser.js';
import inspectState from './inspectState.js';
import { writeCheckpoint } from './checkpointStore.js';

// Snapshots the running app (page state + recorded request/api responses)
// into a checkpoint folder under .lowdefy — see checkpointStore.js for the
// on-disk layout. Reuses inspectState.js's tab-first/headless-fallback
// snapshot rather than driving a browser directly, so a snapshot always
// reflects whatever a developer is actually looking at when one is
// available.
async function snapshotState({ origin, pageId, name, notes, source, overwrite }) {
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return {
      error: `snapshotState requires a "pageId" string. Received ${JSON.stringify(pageId)}.`,
    };
  }
  if (type.isNone(name) || !type.isString(name)) {
    return { error: `snapshotState requires a "name" string. Received ${JSON.stringify(name)}.` };
  }

  const snapshot = await inspectState({ origin, pageId, source });
  if (snapshot?.error) {
    return { error: snapshot.error };
  }

  const url = `${buildPageUrl({ origin, pageId })}${snapshot.urlQuery ?? ''}`;

  try {
    const { dir, parts } = writeCheckpoint({
      name,
      snapshot: { ...snapshot, url },
      notes,
      overwrite,
    });
    return { name, dir, parts, source: snapshot.source };
  } catch (error) {
    return { error: error.message };
  }
}

export default snapshotState;
