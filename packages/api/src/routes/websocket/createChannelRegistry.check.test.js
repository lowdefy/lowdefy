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

const channelResolver = vi.fn(() => new Promise(() => {}));
channelResolver.meta = { publish: true };

// Who may see ticket t-1, read on every check so a test can revoke access.
let ticketViewers;

// Only ticket t-1 may be seen, and only by the users in ticketViewers.
function canViewTicket() {
  return {
    endpointId: 'can-view-ticket',
    type: 'InternalApi',
    auth: { public: true },
    routine: {
      ':return': {
        _and: [
          { _eq: [{ _payload: 'ticket_id' }, 't-1'] },
          { '_array.includes': { on: ticketViewers, value: { _user: 'id' } } },
        ],
      },
    },
  };
}

// A check that does not read the payload: the caller is in the beta group.
function isBeta() {
  return {
    endpointId: 'is-beta',
    type: 'InternalApi',
    auth: { public: true },
    routine: {
      ':return': { '_array.includes': { on: ['user-1'], value: { _user: 'id' } } },
    },
  };
}

const ticketEvents = {
  id: 'websocket:ticket_events',
  type: 'TestSource',
  websocketId: 'ticket_events',
  auth: { public: true },
  check: { endpointId: 'can-view-ticket' },
  properties: { ticket_id: { _payload: 'ticket_id' } },
};

const betaRoom = {
  id: 'websocket:beta_room',
  type: 'TestChannel',
  websocketId: 'beta_room',
  auth: { public: true },
  check: { endpointId: 'is-beta' },
  properties: { publish: true },
};

const lobby = {
  id: 'websocket:lobby',
  type: 'TestSource',
  websocketId: 'lobby',
  auth: { public: true },
  properties: {},
};

const readConfigFile = vi.fn((path) => {
  if (path === 'api/can-view-ticket.json') return canViewTicket();
  if (path === 'api/is-beta.json') return isBeta();
  if (path === 'websockets/ticket_events.json') return ticketEvents;
  if (path === 'websockets/beta_room.json') return betaRoom;
  if (path === 'websockets/lobby.json') return lobby;
  return null;
});

function createContext(userId) {
  const context = testContext({
    operators: operatorsServer,
    readConfigFile,
    user: { id: userId, roles: [] },
  });
  context.websockets = { TestChannel: channelResolver, TestSource: resolver };
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
  ticketViewers = ['user-1', 'user-2'];
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
  const channel = [...registry.channels.values()][0];
  expect(channel.subscribers.size).toBe(1);

  channel.publish({ data: { event: 'reply' } });
  expect(allowed.send).toHaveBeenCalledTimes(1);
  expect(refused.send).not.toHaveBeenCalled();
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

test('a caller the check refuses can not publish into the channel', async () => {
  const registry = createChannelRegistry();
  const subscriber = createSubscriber('a');

  await registry.subscribe(createContext('user-1'), {
    websocketId: 'beta_room',
    payload: {},
    subscriber,
  });
  await expect(
    registry.publish(createContext('user-3'), {
      websocketId: 'beta_room',
      payload: { data: 'spam' },
    })
  ).rejects.toThrow('Websocket "beta_room" does not exist.');
  expect(subscriber.send).not.toHaveBeenCalled();

  await registry.publish(createContext('user-1'), {
    websocketId: 'beta_room',
    payload: { data: 'hello' },
  });
  expect(subscriber.send).toHaveBeenCalledTimes(1);
});

test('a check that reads the payload refuses a publish, which has no payload', async () => {
  const registry = createChannelRegistry();

  await expect(
    registry.publish(createContext('user-1'), { websocketId: 'ticket_events', payload: {} })
  ).rejects.toThrow('Websocket "ticket_events" does not exist.');
});

test('the re-check keeps a subscription the caller may still see', async () => {
  const registry = createChannelRegistry();
  const subscriber = createSubscriber('a');
  const context = createContext('user-1');

  await registry.subscribe(context, {
    websocketId: 'ticket_events',
    payload: { ticket_id: 't-1' },
    subscriber,
  });
  await registry.recheckAccess(context, { websocketId: 'ticket_events', subscriber });

  expect(checkCalls()).toBe(2);
  expect(subscriber.subscriptions.size).toBe(1);
  expect(registry.channels.size).toBe(1);
});

test('the re-check closes a subscription whose access was revoked and leaves the others', async () => {
  const registry = createChannelRegistry();
  const revoked = createSubscriber('a');
  const kept = createSubscriber('b');
  const context = createContext('user-1');

  await registry.subscribe(context, {
    websocketId: 'ticket_events',
    payload: { ticket_id: 't-1' },
    subscriber: revoked,
  });
  await registry.subscribe(createContext('user-2'), {
    websocketId: 'ticket_events',
    payload: { ticket_id: 't-1' },
    subscriber: kept,
  });
  ticketViewers = ['user-2'];

  await expect(
    registry.recheckAccess(context, { websocketId: 'ticket_events', subscriber: revoked })
  ).rejects.toThrow('Websocket "ticket_events" does not exist.');

  expect(revoked.subscriptions.size).toBe(0);
  expect(registry.getCheckedWebsocketIds({ subscriber: revoked })).toEqual([]);
  const channel = [...registry.channels.values()][0];
  expect([...channel.subscribers]).toEqual([kept]);
});

test('only subscriptions to a websocket with a check are re-checked', async () => {
  const registry = createChannelRegistry();
  const subscriber = createSubscriber('a');
  const context = createContext('user-1');

  await registry.subscribe(context, { websocketId: 'lobby', payload: {}, subscriber });
  await registry.subscribe(context, {
    websocketId: 'ticket_events',
    payload: { ticket_id: 't-1' },
    subscriber,
  });
  expect(registry.getCheckedWebsocketIds({ subscriber })).toEqual(['ticket_events']);

  registry.unsubscribe({ websocketId: 'ticket_events', subscriber });
  expect(registry.getCheckedWebsocketIds({ subscriber })).toEqual([]);
});

test('the re-check of a subscription closed while it waited does nothing', async () => {
  const registry = createChannelRegistry();
  const subscriber = createSubscriber('a');
  const context = createContext('user-1');

  await registry.subscribe(context, {
    websocketId: 'ticket_events',
    payload: { ticket_id: 't-1' },
    subscriber,
  });
  registry.unsubscribeAll({ subscriber });
  await registry.recheckAccess(context, { websocketId: 'ticket_events', subscriber });

  expect(checkCalls()).toBe(1);
});
