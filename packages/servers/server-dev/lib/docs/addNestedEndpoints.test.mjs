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

import addNestedEndpoints from './addNestedEndpoints.js';
import addWriteFlags from './addWriteFlags.js';
import collectExercised from './collectExercised.js';
import readRoutineSteps from './readRoutineSteps.js';

function callApi({ id, endpointId, detached }) {
  return {
    id: `endpoint:x:${id}`,
    stepId: id,
    type: 'CallApi',
    properties: { endpointId, ...(detached ? { detached: true } : {}) },
  };
}

const artifacts = {
  'plugins/requestSchemas.json': {
    MongoDBFind: { meta: { checkRead: true, checkWrite: false } },
    MongoDBInsertOne: { meta: { checkRead: false, checkWrite: true } },
  },
  'pages/tickets/requests/list.json': { type: 'MongoDBFind' },
  'pages/tickets/requests/save.json': { type: 'MongoDBInsertOne' },
  // Writes only through the endpoints it calls.
  'api/notify.json': {
    routine: [
      callApi({ id: 'inline', endpointId: 'log' }),
      { ':if': true, ':then': [callApi({ id: 'later', endpointId: 'archive', detached: true })] },
      callApi({ id: 'computed', endpointId: { _payload: 'target' } }),
    ],
  },
  'api/log.json': {
    routine: [
      { id: 'endpoint:log:insert', stepId: 'insert', type: 'MongoDBInsertOne' },
      // A cycle back to the caller.
      callApi({ id: 'back', endpointId: 'notify' }),
    ],
  },
  'api/archive.json': {
    routine: [{ id: 'endpoint:archive:find', stepId: 'find', type: 'MongoDBFind' }],
  },
  'api/read.json': {
    routine: [
      { ':try': [{ id: 'endpoint:read:find', stepId: 'find', type: 'MongoDBFind' }], ':catch': [] },
      callApi({ id: 'archive', endpointId: 'archive' }),
    ],
  },
};

async function readConfigFile(name) {
  return artifacts[name] ?? null;
}

test('readRoutineSteps finds steps inside control objects and not inside step properties', () => {
  const steps = readRoutineSteps({
    routine: [
      { ':if': true, ':then': [{ stepId: 'a', type: 'A' }], ':else': [{ stepId: 'b', type: 'B' }] },
      { stepId: 'c', type: 'C', properties: { nested: [{ stepId: 'd', type: 'D' }] } },
    ],
  });
  expect(steps.map((step) => step.stepId)).toEqual(['a', 'b', 'c']);
});

test('addNestedEndpoints follows in-process and detached CallApi with literal ids, transitively, once each', async () => {
  const result = await addNestedEndpoints({
    endpoints: [{ endpointId: 'notify', calls: 1 }],
    readConfigFile,
  });
  expect(result).toEqual({
    endpoints: [
      { endpointId: 'notify', calls: 1 },
      { endpointId: 'log', via: 'notify', calls: null },
      { endpointId: 'archive', via: 'notify', calls: null },
    ],
    unfollowed: 1,
  });
});

test('addNestedEndpoints keeps an endpoint the browser called itself as called, not nested', async () => {
  const result = await addNestedEndpoints({
    endpoints: [
      { endpointId: 'notify', calls: 1 },
      { endpointId: 'archive', calls: 2 },
    ],
    readConfigFile,
  });
  expect(result.endpoints).toContainEqual({ endpointId: 'archive', calls: 2 });
  expect(result.endpoints.filter((entry) => entry.endpointId === 'archive')).toHaveLength(1);
});

test('addWriteFlags follows checkWrite for a read and a write request type', async () => {
  const { requests } = await addWriteFlags({
    requests: [
      { pageId: 'tickets', requestId: 'list', calls: 1 },
      { pageId: 'tickets', requestId: 'save', calls: 1 },
    ],
    endpoints: [],
    readConfigFile,
    requestSchemas: artifacts['plugins/requestSchemas.json'],
  });
  expect(requests).toEqual([
    { pageId: 'tickets', requestId: 'list', calls: 1, write: false },
    { pageId: 'tickets', requestId: 'save', calls: 1, write: true },
  ]);
});

test('addWriteFlags marks a caller that writes only through a nested endpoint as a write', async () => {
  const { endpoints } = await addWriteFlags({
    requests: [],
    endpoints: [
      { endpointId: 'notify', calls: 1 },
      { endpointId: 'log', via: 'notify', calls: null },
      { endpointId: 'archive', via: 'notify', calls: null },
      { endpointId: 'read', calls: 1 },
    ],
    readConfigFile,
    requestSchemas: artifacts['plugins/requestSchemas.json'],
  });
  expect(endpoints.map(({ endpointId, write }) => [endpointId, write])).toEqual([
    ['notify', true],
    ['log', true],
    ['archive', false],
    ['read', false],
  ]);
});

test('collectExercised merges actors, adds nested endpoints and writes, and leaves events and rendered empty', async () => {
  const exercised = await collectExercised({
    snapshots: [
      {
        pages: ['tickets'],
        appEvents: true,
        requests: [{ pageId: 'tickets', requestId: 'save', calls: 1 }],
        endpoints: [{ endpointId: 'notify', calls: 1 }],
      },
    ],
    readConfigFile,
    requestSchemas: artifacts['plugins/requestSchemas.json'],
  });
  expect(exercised).toEqual({
    pages: ['tickets'],
    appEvents: true,
    requests: [{ pageId: 'tickets', requestId: 'save', calls: 1, write: true }],
    endpoints: [
      { endpointId: 'notify', calls: 1, write: true },
      { endpointId: 'log', via: 'notify', calls: null, write: true },
      { endpointId: 'archive', via: 'notify', calls: null, write: false },
    ],
    unfollowed: 1,
    events: [],
    rendered: {},
  });
});
