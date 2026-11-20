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

import Ajv from 'ajv';
import { expect, test } from 'vitest';

import journeyStubSchema from './journeyStubSchema.js';
import validateJourneyStub from './validateJourneyStub.js';

// The schema is what an agent reads; validateJourneyStub is what runs. These tests hold the two
// to the same entries.
const ajv = new Ajv({ allErrors: true, strict: false });
const validateSchema = ajv.compile(journeyStubSchema);

const VALID_STUBS = [
  { connectionType: 'AxiosHttp', requestType: 'AxiosHttp', answer: { data: { ok: true } } },
  { connectionType: 'AxiosHttp', requestType: 'AxiosHttp', answer: null },
  {
    connectionType: 'AxiosHttp',
    requestType: 'AxiosHttp',
    answer: { data: 'pdf' },
    requestId: 'render_pdf',
    endpoint: 'invoice-send',
    pageId: 'invoice',
    match: { url: '/render' },
  },
  { requestId: 'update_run_lines', fail: 'Write failed on purpose' },
  {
    requestId: 'update_run_lines',
    endpoint: 'billing-run-approve',
    pageId: 'billing',
    fail: 'Write failed on purpose',
    times: 2,
  },
  { requestId: 'update_run_lines', fail: 'Down', times: 'all' },
];

const INVALID_STUBS = [
  [null, 'A journey stub should be an answer'],
  ['AxiosHttp', 'A journey stub should be an answer'],
  [{ requestType: 'AxiosHttp', answer: 1 }, 'A journey stub needs "connectionType".'],
  [{ connectionType: 'AxiosHttp', answer: 1 }, 'A journey stub needs "requestType".'],
  [
    { connectionType: 'AxiosHttp', requestType: 'AxiosHttp' },
    'An answer stub needs "answer", what the request answers.',
  ],
  [
    { connectionType: '', requestType: 'AxiosHttp', answer: 1 },
    'Journey stub "connectionType" should be a non-empty string. Received "".',
  ],
  [
    { connectionType: 'AxiosHttp', requestType: 'AxiosHttp', answer: 1, match: 'url' },
    'Journey stub "match" should be an object of the request values to match. Received "url".',
  ],
  [
    { connectionType: 'AxiosHttp', requestType: 'AxiosHttp', answer: 1, endpoint: 3 },
    'Journey stub "endpoint" should be a non-empty string. Received 3.',
  ],
  [
    { connectionType: 'AxiosHttp', requestType: 'AxiosHttp', answer: 1, times: 2 },
    'An answer stub does not take "times".',
  ],
  [{ fail: 'Down' }, 'A journey stub needs "requestId".'],
  [
    { requestId: 'save', fail: '' },
    'Journey stub "fail" should be a non-empty string. Received "".',
  ],
  [
    { requestId: 'save', fail: 'Down', times: 0 },
    'Journey stub "times" should be a whole number above 0 or "all". Received 0.',
  ],
  [
    { requestId: 'save', fail: 'Down', times: 'every' },
    'Journey stub "times" should be a whole number above 0 or "all". Received "every".',
  ],
  [{ requestId: 'save', fail: 'Down', answer: 1 }, 'A forced failure stub does not take "answer".'],
  [
    { requestId: 'save', fail: 'Down', connectionType: 'MongoDBCollection' },
    'A forced failure stub does not take "connectionType".',
  ],
];

test('validateJourneyStub accepts every answer and forced failure form', () => {
  VALID_STUBS.forEach((stub) => {
    expect(validateJourneyStub({ stub })).toEqual({});
  });
});

test('validateJourneyStub refuses a malformed entry, naming what is wrong', () => {
  INVALID_STUBS.forEach(([stub, message]) => {
    expect(validateJourneyStub({ stub }).error).toContain(message);
  });
});

test('journeyStubSchema accepts and refuses the same entries as validateJourneyStub', () => {
  VALID_STUBS.forEach((stub) => {
    expect(validateSchema(stub)).toBe(true);
  });
  INVALID_STUBS.forEach(([stub]) => {
    expect(validateSchema(stub)).toBe(false);
  });
});
