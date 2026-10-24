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

import createElementRegistry from './createElementRegistry.js';

test('createElementRegistry finds a registered view by kind, page and block id', () => {
  const registry = createElementRegistry();
  const view = { name: 'view' };
  const input = { name: 'input' };
  registry.register({ blockId: 'name', element: view, kind: 'view', pageId: 'home' });
  registry.register({ blockId: 'name', element: input, kind: 'input', pageId: 'home' });
  expect(registry.find({ blockId: 'name', kind: 'view', pageId: 'home' })).toBe(view);
  expect(registry.find({ blockId: 'name', kind: 'input', pageId: 'home' })).toBe(input);
  expect(registry.find({ blockId: 'name', kind: 'view', pageId: 'other' })).toBeNull();
});

test('createElementRegistry keys a scroll view by page alone', () => {
  const registry = createElementRegistry();
  const scrollView = { name: 'scroll' };
  registry.register({ element: scrollView, kind: 'scroll', pageId: 'home' });
  expect(registry.find({ kind: 'scroll', pageId: 'home' })).toBe(scrollView);
});

test('createElementRegistry finds the view registered last, and the one below once it goes', () => {
  const registry = createElementRegistry();
  const below = { name: 'below' };
  const top = { name: 'top' };
  registry.register({ blockId: 'a', element: below, kind: 'view', pageId: 'job' });
  const removeTop = registry.register({ blockId: 'a', element: top, kind: 'view', pageId: 'job' });
  expect(registry.find({ blockId: 'a', kind: 'view', pageId: 'job' })).toBe(top);
  removeTop();
  expect(registry.find({ blockId: 'a', kind: 'view', pageId: 'job' })).toBe(below);
});

test('createElementRegistry finds nothing once every registration is removed', () => {
  const registry = createElementRegistry();
  const remove = registry.register({ blockId: 'a', element: {}, kind: 'view', pageId: 'job' });
  remove();
  remove();
  expect(registry.find({ blockId: 'a', kind: 'view', pageId: 'job' })).toBeNull();
});
