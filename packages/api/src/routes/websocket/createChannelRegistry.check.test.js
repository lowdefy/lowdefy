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

import { vi, beforeEach, expect, test } from 'vitest';
import { operatorsServer } from '@lowdefy/operators-js';

import createChannelRegistry from './createChannelRegistry.js';
import testContext from '../../test/testContext.js';

// The subscribe path end to end: the registry, prepareChannel and the check
// endpoint, with only the config files and the source stubbed.

const resolver = vi.fn(() => new Promise(() => {}));
resolver.meta = { publish: false };

// Only ticket t-1 may be seen, and only by user-1 and user-2.
const canViewTicket = {
  endpointId: 'can-view-ticket',
  type: 'InternalApi',
  auth: { public: true },
  routine: {
    ':return': {
      _and: [
        { _eq: [{ _payload: 'ticket_id' }, 't-1'] },
        { '_array.includes': { on: ['user-1', 'user-2'], value: { _user: 'id' } } },
      ],
    },
  },
};

const ticketEvents = {
  id: 'websocket:ticket_events',
  type: 'TestSource',
  websocketId: 'ticket_events',
  auth: { public: true },
  check: { endpointId: 'can-view-ticket' },
  properties: { ticket_id: { _payload: 'ticket_id' } },
};

const readConfigFile = vi.fn((path) => {
  if (path === 'api/can-view-ticket.json') return canViewTicket;
  if (path === 'websockets/ticket_events.json') return ticketEvents;
  return null;
});

function createContext(userId) {
  const context = testContext({
    operators: operatorsServer,
    readConfigFile,
    user: { id: userId, roles: [] },
  });
  context.websockets = { TestSource: resolver };
  return context;
}

function createSubscriber(id) {
  return { id, subscriptions: new Map(), send: vi.fn() };
}

function checkCalls() {
  return readConfigFile.mock.calls.filter(([path]) => path === 'api/can-view-ticket.json').length;
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('two subscribers that each pass the check share one running source', async () => {
  const registry = createChannelRegistry();
  const first = createSubscriber('a');
  const second = createSubscriber('b');

  await registry.subscribe(createContext('user-1'), {
    websocketId: 'ticket_events',
    payload: { ticket_id: 't-1' },
    subscriber: first,
  });
  await registry.subscribe(createContext('user-2'), {
    websocketId: 'ticket_events',
    payload: { ticket_id: 't-1' },
    subscriber: second,
  });

  expect(checkCalls()).toBe(2);
  expect(registry.channels.size).toBe(1);
  expect(resolver).toHaveBeenCalledTimes(1);
  expect([...registry.channels.values()][0].subscribers.size).toBe(2);
});

test('a subscriber the check refuses does not join a running channel', async () => {
  const registry = createChannelRegistry();
  const allowed = createSubscriber('a');
  const refused = createSubscriber('b');

  await registry.subscribe(createContext('user-1'), {
    websocketId: 'ticket_events',
    payload: { ticket_id: 't-1' },
    subscriber: allowed,
  });
  await expect(
    registry.subscribe(createContext('user-3'), {
      websocketId: 'ticket_events',
      payload: { ticket_id: 't-1' },
      subscriber: refused,
    })
  ).rejects.toThrow('Websocket "ticket_events" does not exist.');

  expect(refused.subscriptions.size).toBe(0);
  expect([...registry.channels.values()][0].subscribers.size).toBe(1);
});

test('a resubscribe runs the check again', async () => {
  const registry = createChannelRegistry();
  const subscriber = createSubscriber('a');
  const context = createContext('user-1');

  await registry.subscribe(context, {
    websocketId: 'ticket_events',
    payload: { ticket_id: 't-1' },
    subscriber,
  });
  // A reconnect opens a new socket, whose subscribe frame reaches the registry
  // as a fresh subscribe after the old socket's subscriptions were removed.
  registry.unsubscribeAll({ subscriber });
  await registry.subscribe(context, {
    websocketId: 'ticket_events',
    payload: { ticket_id: 't-1' },
    subscriber,
  });

  expect(checkCalls()).toBe(2);
  expect(subscriber.subscriptions.size).toBe(1);
});

test('a subscribe with a new payload is checked again and refused for a record the caller may not see', async () => {
  const registry = createChannelRegistry();
  const subscriber = createSubscriber('a');
  const context = createContext('user-1');

  await registry.subscribe(context, {
    websocketId: 'ticket_events',
    payload: { ticket_id: 't-1' },
    subscriber,
  });
  await expect(
    registry.subscribe(context, {
      websocketId: 'ticket_events',
      payload: { ticket_id: 't-2' },
      subscriber,
    })
  ).rejects.toThrow('Websocket "ticket_events" does not exist.');

  expect(checkCalls()).toBe(2);
  // The replaced subscription was closed before the new one was checked.
  expect(subscriber.subscriptions.size).toBe(0);
  expect(registry.channels.size).toBe(0);
});
