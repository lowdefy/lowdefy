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

import _agent from './agent.js';

const agent = { id: 'support_agent', conversationId: 'conv_1' };

test('_agent: id returns the calling agent id', () => {
  expect(_agent({ agent, location: 'location', params: 'id' })).toBe('support_agent');
});

test('_agent: conversationId returns the conversation id', () => {
  expect(_agent({ agent, location: 'location', params: 'conversationId' })).toBe('conv_1');
});

test('_agent: true returns the calling agent', () => {
  expect(_agent({ agent, location: 'location', params: true })).toEqual({
    id: 'support_agent',
    conversationId: 'conv_1',
  });
});

test('_agent: conversationId returns null for a headless agent run', () => {
  expect(
    _agent({
      agent: { id: 'support_agent', conversationId: null },
      location: 'location',
      params: 'conversationId',
    })
  ).toBe(null);
});

test.each([null, undefined])('_agent resolves to null when the agent is %s', (none) => {
  expect(_agent({ agent: none, location: 'location', params: true })).toBe(null);
  expect(_agent({ agent: none, location: 'location', params: 'id' })).toBe(null);
  expect(_agent({ agent: none, location: 'location', params: 'conversationId' })).toBe(null);
  expect(_agent({ agent: none, location: 'location', params: { all: true } })).toBe(null);
});

test('_agent returns the default when not called by an agent', () => {
  expect(
    _agent({ agent: null, location: 'location', params: { key: 'id', default: 'person' } })
  ).toBe('person');
});
