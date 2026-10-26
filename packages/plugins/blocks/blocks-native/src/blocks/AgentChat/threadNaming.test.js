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

import getFirstExchange from './getFirstExchange.js';
import getMessageText from './getMessageText.js';
import getProvisionalTitle from './getProvisionalTitle.js';
import mintConversationId from './mintConversationId.js';

const user = {
  id: 'u1',
  role: 'user',
  parts: [{ type: 'text', text: 'Log a task  to fix\nlogin' }],
};
const reply = {
  id: 'a1',
  role: 'assistant',
  parts: [
    { type: 'step-start' },
    { type: 'text', text: 'Thinking aloud', providerMetadata: { openai: { phase: 'commentary' } } },
    { type: 'tool-write_task', toolCallId: 'c1' },
    { type: 'text', text: 'Logged ACME-900.' },
    { type: 'text', text: 'Anything else?' },
  ],
};

test('getMessageText reads the answer text, a paragraph per part, without commentary', () => {
  expect(getMessageText(reply)).toEqual('Logged ACME-900.\n\nAnything else?');
  expect(getMessageText(undefined)).toEqual('');
});

test('getProvisionalTitle puts the first message on one line, cut at a word near 60', () => {
  expect(getProvisionalTitle(' Log a task  to fix\nlogin ')).toEqual('Log a task to fix login');
  expect(
    getProvisionalTitle(
      'Please log a task for the payroll export that fails on the first of every month'
    )
  ).toEqual('Please log a task for the payroll export that fails on the…');
  expect(getProvisionalTitle('x'.repeat(70))).toEqual(`${'x'.repeat(60)}…`);
  expect(getProvisionalTitle('   ')).toBeNull();
  expect(getProvisionalTitle(undefined)).toBeNull();
});

test('getFirstExchange gives the opening question and reply once the first reply lands', () => {
  expect(
    getFirstExchange({
      messages: [user, reply],
      provisionalTitle: 'Log a task',
      title: 'Log a task',
    })
  ).toEqual({
    prompt: 'Log a task to fix login',
    reply: 'Logged ACME-900. Anything else?',
    replaces: 'Log a task',
  });
});

test('getFirstExchange is null on a later turn and once the person renamed the thread', () => {
  const later = [user, reply, { ...user, id: 'u2' }, { ...reply, id: 'a2' }];
  expect(getFirstExchange({ messages: later, provisionalTitle: 'Log', title: 'Log' })).toBeNull();
  expect(
    getFirstExchange({ messages: [user, reply], provisionalTitle: 'Log', title: 'Mine' })
  ).toBeNull();
  expect(
    getFirstExchange({ messages: [user, reply], provisionalTitle: null, title: null })
  ).toBeNull();
});

test('mintConversationId starts with the scope', () => {
  expect(mintConversationId({ scope: 'acme' })).toMatch(/^acme_\d+\w+$/);
  expect(mintConversationId({})).toMatch(/^chat_/);
  expect(mintConversationId({ scope: 'acme' })).not.toEqual(mintConversationId({ scope: 'acme' }));
});
