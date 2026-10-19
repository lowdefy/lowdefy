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

import buildAppEvents from './buildAppEvents.js';
import testContext from '../test-utils/testContext.js';

function setup(components) {
  const context = testContext();
  context.warnings = [];
  buildAppEvents({ components, context });
  return { components, context };
}

test('buildAppEvents defaults events to an empty object', () => {
  const { components, context } = setup({});
  expect(components.events).toEqual({});
  expect(context.appTypeCounters.actions.getCounts()).toEqual({});
});

test('buildAppEvents throws when events is not an object', () => {
  expect(() => setup({ events: [] })).toThrow('App "events" should be an object.');
});

test('buildAppEvents throws on an event name that is not an app event', () => {
  expect(() => setup({ events: { onMount: [] } })).toThrow(
    'App event "onMount" is not supported. Supported app events: onInit, onInitAsync.'
  );
});

test('buildAppEvents normalizes action lists to try and catch', () => {
  const { components } = setup({
    events: {
      onInit: [{ id: 'set', type: 'SetGlobal', params: { ready: true } }],
      onInitAsync: {
        try: [{ id: 'fetch', type: 'CallAPI', params: { endpointId: 'settings' } }],
      },
    },
    api: [{ endpointId: 'settings', type: 'Api' }],
  });
  expect(components.events).toEqual({
    onInit: { try: [{ id: 'set', type: 'SetGlobal', params: { ready: true } }], catch: [] },
    onInitAsync: {
      try: [{ id: 'fetch', type: 'CallAPI', params: { endpointId: 'settings' } }],
      catch: [],
    },
  });
});

test('buildAppEvents counts action and operator types into the app and app event counters', () => {
  const { context } = setup({
    events: {
      onInit: [{ id: 'set', type: 'SetGlobal', params: { user: { _user: 'id' } } }],
    },
  });
  expect(context.appTypeCounters.actions.getCounts()).toEqual({ SetGlobal: 1 });
  expect(context.appTypeCounters.operators.getCounts()).toEqual({ _user: 1 });
  expect(context.typeCounters.actions.getCounts()).toEqual({ SetGlobal: 1 });
  expect(context.typeCounters.operators.client.getCounts()).toEqual({ _user: 1 });
});

test('buildAppEvents throws when an action id is missing', () => {
  expect(() => setup({ events: { onInit: [{ type: 'SetGlobal' }] } })).toThrow(
    'Action id missing on event "onInit" on block "app" on page "app".'
  );
});

test('buildAppEvents throws on page scoped actions', () => {
  expect(() =>
    setup({ events: { onInit: [{ id: 'set', type: 'SetState', params: { a: 1 } }] } })
  ).toThrow('Action "SetState" can not be used in app events.');
});

test('buildAppEvents throws on page scoped actions inside controls', () => {
  expect(() =>
    setup({
      events: {
        onInit: [{ ':if': true, ':then': [{ id: 'req', type: 'Request', params: 'get' }] }],
      },
    })
  ).toThrow('Action "Request" can not be used in app events.');
});

test('buildAppEvents throws on page scoped operators', () => {
  expect(() =>
    setup({
      events: {
        onInit: [{ id: 'set', type: 'SetGlobal', params: { a: { _state: 'a' } } }],
      },
    })
  ).toThrow('Operator "_state" can not be used in app events.');
});

test('buildAppEvents throws on an event shortcut', () => {
  expect(() => setup({ events: { onInit: { try: [], shortcut: 'mod+k' } } })).toThrow(
    'App event "onInit" can not have a shortcut.'
  );
});

test('buildAppEvents warns when a Link action targets a page that does not exist', () => {
  const { context } = setup({
    events: { onInit: [{ id: 'go', type: 'Link', params: 'missing' }] },
    pages: [{ pageId: 'home' }],
  });
  expect(context.warnings.map((warning) => warning.message)).toEqual([
    expect.stringContaining('Page "missing" not found.'),
  ]);
});

test('buildAppEvents warns when a CallAPI action targets an endpoint that does not exist', () => {
  const { context } = setup({
    events: { onInitAsync: [{ id: 'fetch', type: 'CallAPI', params: { endpointId: 'nope' } }] },
  });
  expect(context.warnings.map((warning) => warning.message)).toEqual([
    expect.stringContaining('references non-existent endpoint "nope"'),
  ]);
});
