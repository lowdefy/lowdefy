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

import { WebParser } from '@lowdefy/operators';
import _websocket from './websocket.js';

const operators = {
  _websocket,
};

const arrayIndices = [1];

const tickerChannel = {
  connected: true,
  error: null,
  lastMessage: { tick: 3, at: 'now' },
  messageCount: 3,
  messages: [{ tick: 1 }, { tick: 2 }, { tick: 3 }],
};

function makeContext({ websockets } = {}) {
  return {
    _internal: {
      lowdefy: {
        inputs: { id: true },
        _internal: {},
      },
    },
    id: 'id',
    websockets,
  };
}

const context = makeContext({ websockets: { ticker: tickerChannel } });

console.error = () => {};

test('_websocket non-string params returns error', () => {
  const input = { _websocket: { id: 'ticker' } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors.length).toBe(1);
  expect(res.errors[0]._message).toBe('_websocket accepts a string value.');
  expect(res.errors[0].message).toBe('_websocket accepts a string value. at locationId.');
});

test('_websocket returns null when context has no websockets', () => {
  const input = { _websocket: 'ticker' };
  const parser = new WebParser({ context: makeContext(), operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toEqual([]);
});

test('_websocket returns null for an unknown channel', () => {
  const input = { _websocket: 'doesNotExist' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toEqual([]);
});

test('_websocket returns the whole channel state for a channel id', () => {
  const input = { _websocket: 'ticker' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(tickerChannel);
  expect(res.errors).toEqual([]);
});

test('_websocket dot notation returns a channel property', () => {
  const input = { _websocket: 'ticker.connected' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toEqual([]);
});

test('_websocket nested dot notation reads into lastMessage', () => {
  const input = { _websocket: 'ticker.lastMessage.tick' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(3);
  expect(res.errors).toEqual([]);
});

test('_websocket dot notation with array index reads into messages', () => {
  const input = { _websocket: 'ticker.messages.0.tick' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(1);
  expect(res.errors).toEqual([]);
});

test('_websocket dot notation with $ applies arrayIndices', () => {
  const input = { _websocket: 'ticker.messages.$.tick' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(2);
  expect(res.errors).toEqual([]);
});

test('_websocket returns null for a missing path on an existing channel', () => {
  const input = { _websocket: 'ticker.doesNotExist.deeper' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toEqual([]);
});
