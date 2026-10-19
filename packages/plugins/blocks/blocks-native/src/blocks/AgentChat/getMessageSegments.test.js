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

import getMessageSegments from './getMessageSegments.js';

const parts = [
  { type: 'step-start' },
  { type: 'reasoning', text: 'Think.' },
  { type: 'tool-search', toolCallId: 'c1' },
  { type: 'tool-get', toolCallId: 'c2' },
  { type: 'source-url', url: 'https://x.test' },
  { type: 'text', text: 'Found it.' },
  { type: 'data-status', data: { message: 'Saving' } },
  { type: 'text', text: 'Saved.' },
  { type: 'text', text: 'Preamble', providerMetadata: { openai: { phase: 'commentary' } } },
];

test('getMessageSegments runs consecutive parts of one kind together, in the order they came', () => {
  expect(
    getMessageSegments({ parts }).map(({ category, key, parts: run }) => [
      category,
      key,
      run.length,
    ])
  ).toEqual([
    ['reasoning', 'reasoning-0', 1],
    ['tool', 'tool-1', 2],
    ['text', 'text-2', 1],
    ['status', 'status-3', 1],
    ['text', 'text-4', 1],
    ['reasoning', 'reasoning-5', 1],
  ]);
});

test('getMessageSegments groups the parts by kind with reasoningDisplay grouped', () => {
  const segments = getMessageSegments({ config: { reasoningDisplay: 'grouped' }, parts });
  expect(segments.map(({ category, parts: run }) => [category, run.length])).toEqual([
    ['reasoning', 2],
    ['tool', 2],
    ['status', 1],
    ['text', 2],
  ]);
});

test('getMessageSegments leaves out the kinds messageDisplay hides', () => {
  const segments = getMessageSegments({
    config: { showReasoning: false, showStatusUpdates: false, showThoughtChain: false },
    parts,
  });
  expect(segments.map(({ category }) => category)).toEqual(['text']);
  expect(segments[0].parts.map((part) => part.text)).toEqual(['Found it.', 'Saved.']);
});
