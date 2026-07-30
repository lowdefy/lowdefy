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

import fs from 'fs';
import path from 'path';
import { ReservedKeyError, serializer, setKey, type } from '@lowdefy/helpers';

import { getConfigDirectory } from './checkpointPaths.js';

// State checkpoints (page state + recorded request/api responses) live under
// <configDir>/.lowdefy/state-checkpoints/<name>/ — inside .lowdefy because a
// checkpoint captures the signed-in user's data and live backend responses,
// which must not sit in a committable spot by default (.lowdefy is gitignored
// by convention and ignored by the dev file watcher). A sibling of
// .lowdefy/checkpoints (the config-directory-snapshot checkpoints in
// checkpointPaths.js/createConfigCheckpoint.js) rather than a subdirectory,
// because that store prunes its oldest directories beyond a cap. These two
// "checkpoint" concepts are unrelated: this one is for putting the *running
// app* into a specific state (agent verification, human testing, e2e test
// generation), not for reverting config files.
const NAME_PATTERN = /^[a-z0-9-_]+$/i;

function getStateCheckpointsRoot() {
  return path.join(getConfigDirectory(), '.lowdefy', 'state-checkpoints');
}

function validateName(name) {
  if (type.isNone(name) || !type.isString(name)) {
    throw new Error(`Checkpoint "name" must be a string. Received ${JSON.stringify(name)}.`);
  }
  if (!NAME_PATTERN.test(name)) {
    throw new Error(
      `Checkpoint name "${name}" is invalid — use only letters, numbers, "-" and "_".`
    );
  }
}

function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(serializer.serialize(value), null, 2));
}

function readJsonFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  return serializer.deserialize(JSON.parse(fs.readFileSync(filePath, 'utf8')));
}

// Requests/api responses arrive as either an array of entries (newest first —
// the shape of context.requests in both Requests.js and Inspector.jsx's
// buildSnapshot) or a single entry object. Either way only the newest
// recording is kept per id.
function newestEntry(value) {
  return Array.isArray(value) ? value[0] : value;
}

function writeEntries({ dir, subdir, entries, parts }) {
  Object.entries(entries ?? {}).forEach(([id, value]) => {
    const entry = newestEntry(value);
    if (type.isNone(entry)) {
      return;
    }
    const { payload, response, error, responseTime } = entry;
    writeJsonFile(path.join(dir, subdir, `${id}.json`), { payload, response, error, responseTime });
    parts.push(`${subdir}/${id}.json`);
  });
}

function readEntries({ dir, subdir }) {
  const entriesDir = path.join(dir, subdir);
  const entries = {};
  if (!fs.existsSync(entriesDir)) {
    return entries;
  }
  fs.readdirSync(entriesDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .forEach((fileName) => {
      const id = fileName.slice(0, -'.json'.length);
      try {
        setKey(entries, id, readJsonFile(path.join(entriesDir, fileName), null));
      } catch (error) {
        if (!(error instanceof ReservedKeyError)) throw error;
        // A checkpoint directory is on-disk state a developer can edit by hand.
        // A reserved file name can't round-trip through the entries map, so skip
        // it rather than fail the whole checkpoint load.
      }
    });
  return entries;
}

// Snapshots a running page's state + recorded request/api responses into a
// checkpoint folder. Refuses to clobber an existing checkpoint unless
// `overwrite: true` — when overwriting, the old folder is removed first so a
// checkpoint written with fewer requests than a previous one doesn't leave
// stale per-request files behind.
function writeCheckpoint({ name, snapshot, notes, overwrite }) {
  validateName(name);
  if (type.isNone(snapshot) || !type.isObject(snapshot)) {
    throw new Error(
      `writeCheckpoint requires a "snapshot" object. Received ${JSON.stringify(snapshot)}.`
    );
  }

  const dir = path.join(getStateCheckpointsRoot(), name);
  const exists = fs.existsSync(dir);
  if (exists && overwrite !== true) {
    throw new Error(`Checkpoint "${name}" already exists. Pass overwrite: true to replace it.`);
  }
  if (exists) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });

  const parts = [];
  const manifest = {
    name,
    pageId: snapshot.pageId ?? null,
    url: snapshot.url ?? null,
    capturedAt: new Date().toISOString(),
    notes: notes ?? null,
  };
  writeJsonFile(path.join(dir, 'checkpoint.json'), manifest);
  parts.push('checkpoint.json');

  writeJsonFile(path.join(dir, 'state.json'), snapshot.state ?? {});
  parts.push('state.json');
  writeJsonFile(path.join(dir, 'urlQuery.json'), snapshot.urlQuery ?? '');
  parts.push('urlQuery.json');
  writeJsonFile(path.join(dir, 'inputs.json'), snapshot.input ?? {});
  parts.push('inputs.json');
  writeJsonFile(path.join(dir, 'user.json'), snapshot.user ?? null);
  parts.push('user.json');
  writeJsonFile(path.join(dir, 'global.json'), snapshot.global ?? {});
  parts.push('global.json');

  writeEntries({ dir, subdir: 'requests', entries: snapshot.requests, parts });
  if (!type.isNone(snapshot.apiResponses)) {
    writeEntries({ dir, subdir: 'api', entries: snapshot.apiResponses, parts });
  }

  return { dir, parts };
}

// Reads a checkpoint back, tolerant of individually missing parts (a
// developer may hand-edit or delete files in a committed checkpoint folder) —
// only a missing checkpoint directory itself is an error.
function readCheckpoint({ name }) {
  validateName(name);
  const dir = path.join(getStateCheckpointsRoot(), name);
  if (!fs.existsSync(dir)) {
    throw new Error(`Checkpoint "${name}" not found.`);
  }

  const checkpoint = readJsonFile(path.join(dir, 'checkpoint.json'), {
    name,
    pageId: null,
    url: null,
    capturedAt: null,
    notes: null,
  });

  return {
    name,
    checkpoint,
    state: readJsonFile(path.join(dir, 'state.json'), {}),
    urlQuery: readJsonFile(path.join(dir, 'urlQuery.json'), ''),
    input: readJsonFile(path.join(dir, 'inputs.json'), {}),
    user: readJsonFile(path.join(dir, 'user.json'), null),
    global: readJsonFile(path.join(dir, 'global.json'), {}),
    requests: readEntries({ dir, subdir: 'requests' }),
    api: readEntries({ dir, subdir: 'api' }),
  };
}

function checkpointExists({ name }) {
  validateName(name);
  return fs.existsSync(path.join(getStateCheckpointsRoot(), name));
}

// Lists stored state checkpoints, most recent first. Corrupted/hand-edited
// checkpoints without a manifest still show up (with null fields) rather
// than being silently hidden, since these folders are meant to be
// human-editable.
function listStateCheckpoints() {
  const root = getStateCheckpointsRoot();
  if (!fs.existsSync(root)) {
    return [];
  }

  const checkpoints = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(root, entry.name);
      const manifest = readJsonFile(path.join(dir, 'checkpoint.json'), {
        name: entry.name,
        pageId: null,
        capturedAt: null,
        notes: null,
      });
      const requestsDir = path.join(dir, 'requests');
      const requestCount = fs.existsSync(requestsDir)
        ? fs.readdirSync(requestsDir).filter((fileName) => fileName.endsWith('.json')).length
        : 0;
      return {
        name: entry.name,
        pageId: manifest.pageId ?? null,
        capturedAt: manifest.capturedAt ?? null,
        notes: manifest.notes ?? null,
        requestCount,
      };
    });

  return checkpoints.sort((a, b) => {
    if (type.isNone(a.capturedAt)) return 1;
    if (type.isNone(b.capturedAt)) return -1;
    return a.capturedAt < b.capturedAt ? 1 : -1;
  });
}

export {
  checkpointExists,
  getStateCheckpointsRoot,
  listStateCheckpoints,
  readCheckpoint,
  writeCheckpoint,
};
