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

import { jest } from '@jest/globals';

import writeJourneyCoverage from './writeJourneyCoverage.js';

function createContext() {
  return { writeBuildArtifact: jest.fn() };
}

function writtenCoverage(context) {
  return JSON.parse(context.writeBuildArtifact.mock.calls[0][1]);
}

test('writeJourneyCoverage writes an empty pages map when the app has no pages', async () => {
  const context = createContext();
  await writeJourneyCoverage({ components: {}, context });
  expect(context.writeBuildArtifact.mock.calls[0][0]).toBe('journeyCoverage.json');
  expect(writtenCoverage(context)).toEqual({ pages: {} });
});

test('writeJourneyCoverage lists the page block events, nested through areas, blocks and slots', async () => {
  const context = createContext();
  const components = {
    pages: [
      {
        pageId: 'home',
        blockId: 'home',
        events: { onInit: { try: [], catch: [] } },
        areas: {
          content: {
            blocks: [
              {
                blockId: 'form',
                blocks: [{ blockId: 'name', events: { onChange: { try: [], catch: [] } } }],
                slots: {
                  footer: {
                    blocks: [{ blockId: 'submit', events: { onClick: { try: [], catch: [] } } }],
                  },
                },
              },
            ],
          },
        },
      },
    ],
  };
  await writeJourneyCoverage({ components, context });
  expect(writtenCoverage(context)).toEqual({
    pages: {
      home: {
        events: [
          { blockId: 'home', event: 'onInit' },
          { blockId: 'name', event: 'onChange' },
          { blockId: 'submit', event: 'onClick' },
        ],
        requestIds: [],
      },
    },
  });
});

test('writeJourneyCoverage lists each page request id and ignores build meta keys on events', async () => {
  const context = createContext();
  const components = {
    pages: [
      {
        pageId: 'users',
        blockId: 'users',
        events: { '~k': 'key:1', onMount: { try: [], catch: [] } },
        requests: [{ requestId: 'get_users' }, { requestId: 'get_roles' }],
      },
    ],
  };
  await writeJourneyCoverage({ components, context });
  expect(writtenCoverage(context)).toEqual({
    pages: {
      users: {
        events: [{ blockId: 'users', event: 'onMount' }],
        requestIds: ['get_users', 'get_roles'],
      },
    },
  });
});
