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

import collectStateUsage, { resolveStatePath } from './collectStateUsage.js';

test('collectStateUsage collects block ids with type, SetState keys and full _state paths', () => {
  const page = {
    pageId: 'page_1',
    blocks: [
      { blockId: 'data.address.formatted_address', type: 'TextInput', '~k': 'k1' },
      {
        blockId: 'button',
        type: 'Button',
        '~k': 'k2',
        events: {
          onClick: [
            { type: 'SetState', params: { 'data.status': 'draft', evidence_ids: [] }, '~k': 'k3' },
          ],
        },
      },
      {
        blockId: 'display',
        type: 'Paragraph',
        properties: { content: { _state: 'data.status', '~k': 'k4' } },
      },
      { properties: { content: { _state: { key: 'evidence_ids[0]' }, '~k': 'k5' } } },
      { properties: { content: { _state: true, '~k': 'k6' } } },
    ],
  };
  expect(collectStateUsage({ page })).toEqual({
    blockIds: [
      { id: 'data.address.formatted_address', type: 'TextInput', configKey: 'k1' },
      { id: 'button', type: 'Button', configKey: 'k2' },
      { id: 'display', type: 'Paragraph', configKey: undefined },
    ],
    setStateKeys: [
      { key: 'data.status', configKey: 'k3' },
      { key: 'evidence_ids', configKey: 'k3' },
    ],
    stateRefs: [
      { path: 'data.status', configKey: 'k4' },
      { path: 'evidence_ids[0]', configKey: 'k5' },
    ],
  });
});

test('collectStateUsage skips _state inside request properties and operator-valued SetState params', () => {
  const page = {
    pageId: 'page_1',
    requests: [
      { id: 'r', properties: { query: { _state: 'server_only', '~k': 'rk' }, '~k': 'rp' } },
    ],
    blocks: [{ type: 'SetState', params: { '_object.assign': [{}] }, '~k': 'k1' }],
  };
  expect(collectStateUsage({ page })).toEqual({ blockIds: [], setStateKeys: [], stateRefs: [] });
});

test('resolveStatePath resolves a path against a nested state schema', () => {
  const stateSchema = {
    type: 'object',
    properties: { data: { type: 'object', properties: { status: { type: 'string' } } } },
  };
  expect(resolveStatePath({ stateSchema, path: 'data.status' })).toEqual({ type: 'string' });
  expect(resolveStatePath({ stateSchema, path: 'data.statuss' })).toBeNull();
});
