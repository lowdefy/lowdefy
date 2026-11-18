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

import { expect, test } from 'vitest';

import checkJourneyStubTargets from './checkJourneyStubTargets.js';

const connections = {
  AxiosHttp: { requests: { AxiosHttp: async () => null } },
  MongoDBCollection: { requests: { MongoDBInsertOne: async () => {} } },
};

test('checkJourneyStubTargets passes answer stubs on types the app has, and fail gates', () => {
  expect(
    checkJourneyStubTargets({
      connections,
      stubs: [
        { connectionType: 'AxiosHttp', requestType: 'AxiosHttp', answer: { rate: 1.5 } },
        { requestId: 'save_price', fail: 'Write failed on purpose' },
      ],
    })
  ).toBeUndefined();
  expect(checkJourneyStubTargets({ connections, stubs: undefined })).toBeUndefined();
});

test('checkJourneyStubTargets refuses an answer stub on a connection type the app does not have, naming the stub', () => {
  expect(
    checkJourneyStubTargets({
      connections,
      stubs: [
        { requestId: 'save_price', fail: 'Write failed on purpose' },
        { connectionType: 'Knex', requestType: 'KnexRaw', answer: [] },
      ],
    })
  ).toEqual(
    'Journey "stubs[1]": Connection type "Knex" is not used by this app. Its connection types are "AxiosHttp", "MongoDBCollection".'
  );
});

test('checkJourneyStubTargets refuses an answer stub on a request type its connection type does not have', () => {
  expect(
    checkJourneyStubTargets({
      connections,
      stubs: [{ connectionType: 'MongoDBCollection', requestType: 'MongoDBFind', answer: [] }],
    })
  ).toEqual(
    'Journey "stubs[0]": Request type "MongoDBFind" is not a request of connection type "MongoDBCollection". Its request types are "MongoDBInsertOne".'
  );
});
