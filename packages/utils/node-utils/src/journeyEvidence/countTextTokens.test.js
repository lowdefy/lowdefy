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

import countTextTokens from './countTextTokens.js';

function click({ block = 'grid', column = 'name', token, config = false, person = 'p1' }) {
  return {
    page: 'tickets',
    block_id: block,
    column,
    text_token: token,
    config_text: config,
    person,
  };
}

function hexToken(number) {
  return `t_${number.toString(16).padStart(16, '0')}`;
}

test('countTextTokens counts clicks, distinct unresolved tokens and the top tokens per place', () => {
  const segments = [
    {
      text_clicks: [
        click({ token: hexToken(1), person: 'p1' }),
        click({ token: hexToken(1), person: 'p2' }),
        click({ token: hexToken(2), person: 'p1' }),
      ],
    },
    {
      text_clicks: [
        click({ token: hexToken(1), person: 'p1' }),
        click({ block: 'assign', column: null, token: hexToken(9), config: true }),
      ],
    },
  ];
  expect(countTextTokens({ segments })).toEqual([
    {
      page: 'tickets',
      block_id: 'grid',
      column: 'name',
      clicks: 4,
      tokens: 2,
      top: [
        { token: hexToken(1), clicks: 3, persons: 2 },
        { token: hexToken(2), clicks: 1, persons: 1 },
      ],
    },
  ]);
});

test('countTextTokens lists at most five top tokens and sorts places by page, block and column', () => {
  const segments = [
    {
      text_clicks: [
        ...[1, 2, 3, 4, 5, 6, 7].map((number) => click({ token: hexToken(number) })),
        click({ block: 'actions', column: null, token: hexToken(20) }),
        click({ block: null, column: null, token: hexToken(30) }),
      ],
    },
  ];
  const rows = countTextTokens({ segments });
  expect(rows.map((row) => row.block_id)).toEqual([null, 'actions', 'grid']);
  expect(rows[2].tokens).toEqual(7);
  expect(rows[2].top.map((entry) => entry.token)).toEqual([1, 2, 3, 4, 5].map(hexToken));
});

test('countTextTokens lists no place whose clicks all resolved to config text', () => {
  const segments = [{ text_clicks: [click({ token: hexToken(1), config: true })] }];
  expect(countTextTokens({ segments })).toEqual([]);
  expect(countTextTokens({ segments: [{}] })).toEqual([]);
});
