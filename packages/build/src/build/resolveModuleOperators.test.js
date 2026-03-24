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

import { scopeMenuItemIds } from './resolveModuleOperators.js';

describe('scopeMenuItemIds', () => {
  test('prefixes all id fields in a flat links array', () => {
    const links = [{ id: 'home' }, { id: 'about' }];
    scopeMenuItemIds(links, 'team-users');
    expect(links).toEqual([{ id: 'team-users/home' }, { id: 'team-users/about' }]);
  });

  test('prefixes ids in nested links', () => {
    const links = [
      {
        id: 'group',
        links: [{ id: 'item1' }, { id: 'item2', links: [{ id: 'nested' }] }],
      },
    ];
    scopeMenuItemIds(links, 'mod');
    expect(links).toEqual([
      {
        id: 'mod/group',
        links: [{ id: 'mod/item1' }, { id: 'mod/item2', links: [{ id: 'mod/nested' }] }],
      },
    ]);
  });

  test('handles non-array input gracefully', () => {
    expect(() => scopeMenuItemIds(null, 'mod')).not.toThrow();
    expect(() => scopeMenuItemIds(undefined, 'mod')).not.toThrow();
  });

  test('handles items without id', () => {
    const links = [{ title: 'no-id' }, { id: 'has-id' }];
    scopeMenuItemIds(links, 'mod');
    expect(links).toEqual([{ title: 'no-id' }, { id: 'mod/has-id' }]);
  });
});
