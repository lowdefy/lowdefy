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

import { jest } from '@jest/globals';
import { WebParser } from '@lowdefy/operators';

import * as operatorsClient from './operatorsClient.js';

// Every browser operator is called through the real WebParser with a recorder active, so the
// recorded keys are the ones the engine will see, including _js accessor and _operator calls.

// Pure calls are counted apart from the events: they only prove the parser recorded the call.
function createRecorder() {
  const events = [];
  const recorder = {
    events,
    pureCalls: 0,
    pure: () => {
      recorder.pureCalls += 1;
    },
    read: (key) => events.push(['read', key]),
    untracked: (reason) => events.push(['untracked', reason]),
    volatile: (reason) => events.push(['volatile', reason]),
  };
  return recorder;
}

const jsMap = {
  readsState: ({ state }) => state('a') + state('list.$.b'),
  readsGlobalAndUser: ({ lowdefyGlobal, user }) => `${lowdefyGlobal('g')} ${user('name')}`,
  readsLocation: ({ location }) => location('href'),
  pure: ({ args }) => args.x + 1,
  clock: () => Date.now(),
  columns: ({ state }) => [{ field: 'a', valueFormatter: () => state('a') }],
};
jsMap.clock.volatile = true;

function createContext() {
  return {
    _internal: {
      lowdefy: {
        apiResponses: { endpoint: [{ response: 1 }] },
        basePath: '',
        home: { pageId: 'home' },
        i18n: { active: 'en', locales: ['en'], messages: { en: { key: 'Key' } } },
        inputs: { page: { i: 1 } },
        lowdefyApp: { name: 'app' },
        lowdefyGlobal: { g: 'global' },
        menus: [{ menuId: 'default', links: [] }],
        pageId: 'page',
        theme: {},
        user: { name: 'user', roles: ['admin'] },
        _internal: {
          globals: {
            window: {
              innerHeight: 800,
              innerWidth: 1000,
              location: { href: 'http://localhost/page', search: '?q=1' },
            },
          },
        },
      },
      readRecorder: null,
    },
    eventLog: [],
    id: 'page',
    jsMap,
    requests: { req: [{ loading: false, response: { data: [1] } }] },
    state: { a: 1, field: 'text', list: [{ b: 2 }, { b: 3 }] },
    websockets: {},
  };
}

function record({ arrayIndices = [1], input, location = 'field' }) {
  const context = createContext();
  const parser = new WebParser({ context, operators: { ...operatorsClient } });
  const recorder = createRecorder();
  context._internal.readRecorder = recorder;
  const { errors, output } = parser.parse({ arrayIndices, input, location });
  return { errors, events: recorder.events, output, pureCalls: recorder.pureCalls };
}

test('every browser operator carries a tracking declaration', () => {
  const undeclared = Object.entries(operatorsClient)
    .filter(([, operatorFn]) => operatorFn.tracking === undefined)
    .map(([name]) => name);
  expect(undeclared).toEqual([]);
});

test.each([
  ['_state path with $', { _state: 'list.$.b' }, [['read', 'state:list.1.b']]],
  ['_state all', { _state: true }, [['read', 'state:*']]],
  ['_state key with default', { _state: { key: 'a', default: 0 } }, [['read', 'state:a']]],
  ['_state null key', { _state: { key: null, default: 0 } }, []],
  ['_global', { _global: 'g' }, [['read', 'global:g']]],
  ['_input', { _input: 'i' }, [['read', 'input:i']]],
  ['_user', { _user: 'name' }, [['read', 'user:name']]],
  ['_user.hasRole', { '_user.hasRole': 'admin' }, [['read', 'user:roles']]],
  ['_request', { _request: 'req.data.0' }, [['read', 'request:req']]],
  ['_request_details', { _request_details: 'req.0.loading' }, [['read', 'request:req']]],
  ['_request_details all', { _request_details: true }, [['read', 'request:*']]],
  ['_api', { _api: 'endpoint.response' }, [['read', 'api:endpoint']]],
  ['_menu', { _menu: 'default' }, [['read', 'menu']]],
  ['_index', { _index: 0 }, [['read', 'index']]],
  ['_t', { _t: 'key' }, [['read', 'i18n']]],
  ['_locale', { _locale: 'active' }, [['read', 'i18n']]],
  ['_theme', { _theme: 'colorPrimary' }, [['read', 'theme']]],
  ['_type reads its own location', { _type: 'string' }, [['read', 'state:field']]],
  ['_type reads key', { _type: { type: 'string', key: 'a' } }, [['read', 'state:a']]],
  ['_type with on', { _type: { type: 'string', on: 'x' } }, []],
  ['_regex reads its own location', { _regex: 'te' }, [['read', 'state:field']]],
  ['_regex reads key', { _regex: { pattern: 'te', key: 'a' } }, [['read', 'state:a']]],
  ['_regex with on', { _regex: { pattern: 'te', on: 'text' } }, []],
  ['_date now', { _date: 'now' }, [['volatile', '_date']]],
  ['_date.now', { '_date.now': null }, [['volatile', '_date.now']]],
  ['_date method on no date', { '_date.getFullYear': null }, [['volatile', '_date.getFullYear']]],
  ['_date method on a date', { '_date.getFullYear': { _date: 0 } }, []],
  ['_math.random', { '_math.random': null }, [['volatile', '_math.random']]],
  ['_math random by name', { _math: 'random' }, [['volatile', '_math']]],
  ['_math.abs', { '_math.abs': -1 }, []],
  [
    '_intl.dateTimeFormat of now',
    { '_intl.dateTimeFormat': { options: {} } },
    [['volatile', '_intl.dateTimeFormat']],
  ],
  ['_intl.dateTimeFormat of a date', { '_intl.dateTimeFormat': { on: { _date: 0 } } }, []],
  ['_random', { _random: 'string' }, [['volatile', '_random']]],
  ['_location', { _location: 'href' }, [['volatile', '_location']]],
  ['_location pageId (fixed for the context)', { _location: 'pageId' }, []],
  ['_location basePath', { _location: 'basePath' }, []],
  ['_media', { _media: 'size' }, [['volatile', '_media']]],
  ['_url_query', { _url_query: 'q' }, [['volatile', '_url_query']]],
  ['_event_log', { _event_log: true }, [['untracked', '_event_log']]],
  ['_websocket', { _websocket: 'channel' }, [['untracked', '_websocket']]],
  [
    '_function',
    { _function: { __state: 'a' } },
    [
      ['untracked', '_function'],
      ['untracked', '_function returned a function'],
    ],
  ],
  [
    '_js accessor reads',
    { _js: 'readsState' },
    [
      ['read', 'state:a'],
      ['read', 'state:list.1.b'],
    ],
  ],
  [
    '_js global and user accessors',
    { _js: 'readsGlobalAndUser' },
    [
      ['read', 'global:g'],
      ['read', 'user:name'],
    ],
  ],
  ['_js location accessor', { _js: 'readsLocation' }, [['volatile', '_location']]],
  ['_js pure', { _js: { fn: 'pure', args: { x: 1 } } }, []],
  ['_js volatile', { _js: 'clock' }, [['volatile', '_js']]],
  ['_js returning functions', { _js: 'columns' }, [['untracked', '_js returned a function']]],
  ['_operator', { _operator: { name: '_state', params: 'a' } }, [['read', 'state:a']]],
  [
    '_operator with a method',
    { _operator: { name: '_math.random' } },
    [['volatile', '_math.random']],
  ],
  ['_args', { _args: 0 }, []],
  ['_event', { _event: 'x' }, []],
  ['_actions', { _actions: 'x' }, []],
  ['_error', { _error: 'x' }, []],
  ['_app', { _app: 'name' }, []],
  ['_log', { _log: 'x' }, []],
  [
    'pure operators over reads',
    { _if: { test: { _eq: [{ _state: 'a' }, 1] }, then: { _sum: [1, 2] }, else: 0 } },
    [['read', 'state:a']],
  ],
])('%s', (_, input, expected) => {
  // _log writes its params to the console.
  jest.spyOn(console, 'log').mockImplementation(() => {});
  const { events, pureCalls } = record({ input });
  expect(events).toEqual(expected);
  // Every call signals the recorder, so the engine can tell a pure block from a parser that does not
  // record.
  expect(events.length + pureCalls).toBeGreaterThan(0);
});

test('_js accessor reads are recorded on the compiled path too', () => {
  const context = createContext();
  const parser = new WebParser({ context, operators: { ...operatorsClient } });
  const input = { value: { _js: 'readsState' } };
  const recorded = [1, 2].map(() => {
    const recorder = createRecorder();
    context._internal.readRecorder = recorder;
    const { output } = parser.parse({ arrayIndices: [0], input, location: 'field' });
    context._internal.readRecorder = null;
    return { events: recorder.events, output };
  });
  expect(recorded[1]).toEqual(recorded[0]);
  expect(recorded[1].output).toEqual({ value: 3 });
  expect(recorded[1].events).toEqual([
    ['read', 'state:a'],
    ['read', 'state:list.0.b'],
  ]);
});
