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

import withPartial from './withPartial.js';

const sam = { kind: 'mention', id: 'u1', name: 'Sam Taylor', sees: true };

test('withPartial shows the words at the cursor, spaced as they will commit', () => {
  expect(
    withPartial({
      segments: [sam, { kind: 'text', text: ' see end' }],
      selection: { start: 15, end: 15 },
      partial: 'the',
    })
  ).toEqual({
    segments: [
      sam,
      { kind: 'text', text: ' see' },
      { kind: 'partial', text: ' the' },
      { kind: 'text', text: ' end' },
    ],
    display: '@Sam Taylor see the end',
  });
});

test('withPartial stands in for a selected range', () => {
  expect(
    withPartial({
      segments: [{ kind: 'text', text: 'Fix the gate today' }],
      selection: { start: 8, end: 12 },
      partial: 'door',
    })
  ).toEqual({
    segments: [
      { kind: 'text', text: 'Fix the ' },
      { kind: 'partial', text: 'door' },
      { kind: 'text', text: ' today' },
    ],
    display: 'Fix the door today',
  });
});
