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

import runTest from './test/runTest.js';

const chatText = 'My ID is 8001015009087';

const payload = {
  messages: [{ id: 'msg_1', role: 'user', parts: [{ type: 'text', text: chatText }] }],
};

function request(stepId, response) {
  return {
    id: `request:test_endpoint:${stepId}`,
    type: 'TestRequest',
    stepId,
    connectionId: 'test',
    properties: { response },
  };
}

function loggedText(context) {
  return JSON.stringify(
    ['debug', 'info', 'warn', 'error'].flatMap((level) => context.logger[level].mock.calls)
  );
}

test('routine logs leave evaluated values out at every level', async () => {
  const routine = [
    request('save_thread', { _payload: 'messages' }),
    { ':set_state': { thread: { _payload: 'messages' } } },
    { ':if': { _state: 'thread.0.parts.0.text' }, ':then': [] },
    {
      ':switch': [{ ':case': { _state: 'thread.0.parts.0.text' }, ':then': [] }],
    },
    {
      ':for': 'message',
      ':in': { _payload: 'messages' },
      ':do': [{ ':set_state': { last: { _item: 'message' } } }],
    },
    {
      ':parallel_for': 'message',
      ':in': { _payload: 'messages' },
      ':do': [request('echo_message', { _item: 'message' })],
    },
    { ':return': { _state: 'thread' } },
  ];
  const { res, context } = await runTest({ routine, payload });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual(payload.messages);
  expect(context.logger.debug).toHaveBeenCalled();
  expect(loggedText(context)).not.toContain(chatText);
});

test('routine logs keep the keys, counts and outcomes they trace', async () => {
  const routine = [
    { ':set_state': { thread: { _payload: 'messages' } } },
    { ':if': { _state: 'thread.0.parts.0.text' }, ':then': [] },
    {
      ':for': 'message',
      ':in': { _payload: 'messages' },
      ':do': [],
    },
  ];
  const { context } = await runTest({ routine, payload });
  const calls = context.logger.debug.mock.calls.map(([fields]) => fields);
  expect(calls).toContainEqual({
    event: 'debug_control_set_state',
    input: { thread: { _payload: 'messages' } },
    keys: ['thread'],
  });
  expect(calls).toContainEqual({
    event: 'debug_control_if',
    condition: { input: { _state: 'thread.0.parts.0.text' }, result: true },
  });
  expect(calls).toContainEqual({ event: 'debug_control_for', itemCount: 1, itemName: 'message' });
  expect(calls).toContainEqual({
    event: 'debug_control_for_iteration',
    itemName: 'message',
    index: 0,
  });
});
