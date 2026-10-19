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

import isOnPath from './isOnPath.js';

const exercised = {
  pages: ['tickets'],
  appEvents: true,
  requests: [{ pageId: 'tickets', requestId: 'assign', calls: 1, write: true }],
  endpoints: [
    { endpointId: 'notify', calls: 1, write: true },
    { endpointId: 'log', via: 'notify', calls: null, write: true },
  ],
  events: [
    { scope: 'page', pageId: 'tickets', blockId: 'submit', eventName: 'onClick', actionIds: [] },
  ],
  rendered: { tickets: ['grid', 'form', 'submit'] },
};

test.each([
  [
    { type: 'action', pageId: 'tickets', blockId: 'submit', eventName: 'onClick' },
    'drop-action',
    true,
  ],
  [
    { type: 'action', pageId: 'tickets', blockId: 'submit', eventName: 'onBlur' },
    'drop-action',
    false,
  ],
  [
    { type: 'action', pageId: 'other', blockId: 'submit', eventName: 'onClick' },
    'drop-action',
    false,
  ],
  [{ type: 'action', pageId: 'app', blockId: null, eventName: 'onInit' }, 'drop-action', true],
  [
    { type: 'block', pageId: 'tickets', blockId: 'grid', parentBlockId: 'tickets' },
    'drop-block',
    true,
  ],
  [
    { type: 'block', pageId: 'tickets', blockId: 'hidden', parentBlockId: 'form' },
    'drop-block',
    false,
  ],
  [
    { type: 'block', pageId: 'tickets', blockId: 'hidden', parentBlockId: 'form' },
    'flip-visible',
    true,
  ],
  [
    { type: 'block', pageId: 'tickets', blockId: 'hidden', parentBlockId: 'gone' },
    'flip-visible',
    false,
  ],
  [{ type: 'request', pageId: 'tickets', requestId: 'assign' }, 'drop-payload', true],
  [{ type: 'request', pageId: 'other', requestId: 'assign' }, 'drop-payload', false],
  [{ type: 'endpoint', endpointId: 'notify' }, 'drop-step', true],
  [{ type: 'endpoint', endpointId: 'log' }, 'drop-step', true],
  [{ type: 'endpoint', endpointId: 'archive' }, 'drop-step', false],
])('isOnPath %j with %s is %s', (anchor, operator, expected) => {
  expect(isOnPath({ anchor, operator, exercised })).toBe(expected);
});
