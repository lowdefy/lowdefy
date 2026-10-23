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

import fetchCellRaw, { readCellRawResult } from './fetchCellRaw.js';

const answered = (response) => ({
  success: true,
  responses: {
    __tableCellRaw: { response: { response, status: 'success', success: true } },
  },
});

test('readCellRawResult reads the endpoint response as { raw }', () => {
  expect(readCellRawResult(answered({ raw: { title: 'Head of CX' } }))).toEqual({
    raw: { title: 'Head of CX' },
  });
  expect(readCellRawResult(answered({ raw: null }))).toEqual({ raw: null });
  expect(readCellRawResult(answered({ raw: undefined }))).toEqual({ raw: null });
});

test('readCellRawResult reads a failed call or another answer as an error', () => {
  const error = { error: 'The raw result could not be loaded.' };
  expect(readCellRawResult({ success: false })).toEqual(error);
  expect(readCellRawResult(answered({ refused: true }))).toEqual(error);
  expect(readCellRawResult(answered(null))).toEqual(error);
  expect(readCellRawResult(undefined)).toEqual(error);
});

test('fetchCellRaw calls the endpoint with the row key and the column key', async () => {
  const registered = [];
  const triggered = [];
  const api = {
    methods: {
      registerEvent: (event) => registered.push(event),
      triggerEvent: async (event) => {
        triggered.push(event);
        return answered({ raw: { email: 'a@example.com' } });
      },
    },
  };
  const answer = await fetchCellRaw({
    api,
    endpoint: 'leads_cell_raw',
    rowKey: 'r1',
    key: 'email',
  });
  expect(answer).toEqual({ raw: { email: 'a@example.com' } });
  expect(registered).toEqual([
    {
      name: '__tableCellRaw',
      actions: [
        {
          id: '__tableCellRaw',
          type: 'CallAPI',
          params: { endpointId: 'leads_cell_raw', payload: { _event: true } },
          messages: { error: false },
        },
      ],
    },
  ]);
  expect(triggered).toEqual([{ name: '__tableCellRaw', event: { rowKey: 'r1', key: 'email' } }]);
});

test('fetchCellRaw returns an error when the event throws', async () => {
  const api = {
    methods: {
      registerEvent: () => {},
      triggerEvent: async () => {
        throw new Error('Network down');
      },
    },
  };
  expect(
    await fetchCellRaw({ api, endpoint: 'leads_cell_raw', rowKey: 'r1', key: 'email' })
  ).toEqual({ error: 'The raw result could not be loaded.' });
});
