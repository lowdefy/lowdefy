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

import { expect, test, vi } from 'vitest';

import _mcp from './mcp.js';

test('_mcp returns null for every key when the page is not inside a host', () => {
  expect(_mcp({ params: 'embedded' })).toBe(null);
  expect(_mcp({ params: 'displayMode' })).toBe(null);
  expect(_mcp({ mcp: null, params: 'embedded' })).toBe(null);
  expect(_mcp({ mcp: null, params: 'displayMode' })).toBe(null);
});

test('_mcp embedded is true inside a host', () => {
  const mcp = { getDisplayMode: vi.fn(() => 'inline') };
  expect(_mcp({ mcp, params: 'embedded' })).toBe(true);
  expect(mcp.getDisplayMode).not.toHaveBeenCalled();
});

test('_mcp displayMode returns the display mode the host reports now', () => {
  let displayMode = 'inline';
  const mcp = { getDisplayMode: () => displayMode };
  expect(_mcp({ mcp, params: 'displayMode' })).toBe('inline');
  displayMode = 'fullscreen';
  expect(_mcp({ mcp, params: 'displayMode' })).toBe('fullscreen');
  displayMode = 'pip';
  expect(_mcp({ mcp, params: 'displayMode' })).toBe('pip');
});

test('_mcp throws on an unknown key, inside and outside a host', () => {
  const message = '_mcp only returns values for displayMode, embedded.';
  expect(() => _mcp({ params: 'theme' })).toThrow(message);
  expect(() => _mcp({ mcp: { getDisplayMode: () => 'inline' }, params: 'theme' })).toThrow(message);
  expect(() => _mcp({ params: { key: 'embedded' } })).toThrow(message);
  expect(() => _mcp({ params: null })).toThrow(message);
  expect(() => _mcp({})).toThrow(message);
});

test('_mcp is dynamic, reads mcp:displayMode for displayMode and is pure for embedded', () => {
  expect(_mcp.dynamic).toBe(true);
  expect(_mcp.tracking({ params: 'displayMode' })).toEqual({
    kind: 'read',
    keys: ['mcp:displayMode'],
  });
  expect(_mcp.tracking({ params: 'embedded' })).toEqual({ kind: 'pure' });
});
