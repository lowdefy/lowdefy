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

import { hasVisibleContent, isPartVisible, partCategory } from './messageParts.js';
import replayableMessages from './replayableMessages.js';

test('partCategory sorts parts into what a reply draws', () => {
  expect(partCategory({ type: 'step-start' })).toBeNull();
  expect(partCategory({ type: 'reasoning' })).toEqual('reasoning');
  expect(
    partCategory({ type: 'text', providerMetadata: { openai: { phase: 'commentary' } } })
  ).toEqual('reasoning');
  expect(partCategory({ type: 'tool-search' })).toEqual('tool');
  expect(partCategory({ type: 'dynamic-tool' })).toEqual('tool');
  expect(partCategory({ type: 'data-status' })).toEqual('status');
  expect(partCategory({ type: 'data-suggestions' })).toBeNull();
});

test('hasVisibleContent is false until a reply has something to show', () => {
  expect(hasVisibleContent({ parts: [{ type: 'step-start' }, { type: 'text', text: '' }] })).toBe(
    false
  );
  expect(hasVisibleContent({ parts: [{ type: 'text', text: 'Hi' }] })).toBe(true);
  expect(isPartVisible({ type: 'tool-get' }, { showThoughtChain: false })).toBe(false);
});

test('replayableMessages drops a cut-off tool call and a reply left with nothing', () => {
  const messages = [
    { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
    {
      id: 'a1',
      role: 'assistant',
      parts: [
        { type: 'step-start' },
        { type: 'tool-get', toolCallId: 'c1', state: 'input-available' },
      ],
    },
    {
      id: 'a2',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Partly' },
        { type: 'tool-get', toolCallId: 'c2', state: 'input-streaming' },
        { type: 'tool-get', toolCallId: 'c3', state: 'input-available' },
      ],
    },
  ];
  const kept = replayableMessages({ messages, liveToolCallIds: new Set(['c3']) });
  expect(kept.map((message) => message.id)).toEqual(['u1', 'a2']);
  expect(kept[1].parts.map((part) => part.toolCallId ?? part.type)).toEqual(['text', 'c3']);
  expect(replayableMessages({ messages: [messages[0]] })).toEqual([messages[0]]);
});
