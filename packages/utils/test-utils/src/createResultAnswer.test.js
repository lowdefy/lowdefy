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

import * as helpers from '@lowdefy/helpers';
import { expect, test } from 'vitest';

import createResultAnswer from './createResultAnswer.js';

const testApp = { modules: { helpers } };
const { serializer } = helpers;

test('createResultAnswer answers 200 with the response read as the client reads it and the body as sent', () => {
  const at = new Date('2026-03-04T05:06:07Z');
  const faults = [];
  const answer = createResultAnswer({
    faults,
    result: {
      error: null,
      response: serializer.serialize({ run: { id: 'BR-1', at } }),
      status: 'success',
      success: true,
    },
    testApp,
  });
  expect(answer).toEqual({
    status: 200,
    success: true,
    response: { run: { id: 'BR-1', at } },
    error: null,
    body: {
      error: null,
      response: { run: { id: 'BR-1', at: { '~d': at.valueOf() } } },
      status: 'success',
      success: true,
    },
    faults: [],
  });
  expect(answer.response.run.at).toBeInstanceOf(Date);
  expect(answer.faults).toBe(faults);
});

test('createResultAnswer answers 200 with success false and the error for a routine that failed', () => {
  const answer = createResultAnswer({
    faults: [],
    result: {
      error: serializer.serialize(new Error('Run is already approved.')),
      response: null,
      status: 'error',
      success: false,
    },
    testApp,
  });
  expect(answer.status).toEqual(200);
  expect(answer.success).toBe(false);
  expect(answer.response).toBeNull();
  expect(answer.error).toBeInstanceOf(Error);
  expect(answer.error.message).toEqual('Run is already approved.');
  expect(answer.body.error['~e'].message).toEqual('Run is already approved.');
});

test('createResultAnswer answers a page request, which has no error field, with error null', () => {
  const answer = createResultAnswer({
    faults: [],
    result: { id: 'request:home:get_runs', success: true, type: 'MongoDBFind', response: [] },
    testApp,
  });
  expect(answer.status).toEqual(200);
  expect(answer.error).toBeNull();
  expect(answer.response).toEqual([]);
  expect(answer.body.type).toEqual('MongoDBFind');
});

test('createResultAnswer answers null for a response that is undefined, as JSON drops it', () => {
  const answer = createResultAnswer({
    faults: [],
    result: { error: null, response: undefined, status: 'success', success: true },
    testApp,
  });
  expect(answer.response).toBeNull();
  expect(Object.hasOwn(answer.body, 'response')).toBe(false);
});
