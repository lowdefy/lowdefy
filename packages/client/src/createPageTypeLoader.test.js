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

import createPageTypeLoader from './createPageTypeLoader.js';

const Box = () => 'Box';
const Button = () => 'Button';
const Card = () => 'Card';
const Link = () => 'Link';
const _state = () => '_state';

function makeTypes() {
  return { actions: {}, blocks: {}, operators: {} };
}

function makeLoader({ loadFullTypes, pageTypeModules, types }) {
  return createPageTypeLoader({
    loadFullTypes:
      loadFullTypes ??
      jest.fn(async () => ({
        actions: { Link },
        blocks: { Box, Button, Card },
        operators: { _state },
      })),
    pageTypeModules,
    types,
  });
}

test('createPageTypeLoader registers a page module into the type registries', async () => {
  const types = makeTypes();
  const loadFullTypes = jest.fn();
  const loadPageTypes = makeLoader({
    loadFullTypes,
    pageTypeModules: {
      one: async () => ({ actions: { Link }, blocks: { Box, Button }, operators: { _state } }),
    },
    types,
  });
  await loadPageTypes({
    pageConfig: { id: 'page:one', type: 'Box', blocks: [{ type: 'Button' }] },
    pageId: 'one',
  });
  expect(types.blocks).toEqual({ Box, Button });
  expect(types.actions).toEqual({ Link });
  expect(types.operators).toEqual({ _state });
  expect(loadFullTypes).not.toHaveBeenCalled();
});

test('createPageTypeLoader loads the full barrels for a page with no module', async () => {
  const types = makeTypes();
  const loadPageTypes = makeLoader({ pageTypeModules: {}, types });
  await loadPageTypes({ pageConfig: { type: 'Box' }, pageId: '404' });
  expect(types.blocks).toEqual({ Box, Button, Card });
});

test('createPageTypeLoader loads the full barrels for a type the page module lacks', async () => {
  const types = makeTypes();
  const loadFullTypes = jest.fn(async () => ({
    actions: { Link },
    blocks: { Box, Button, Card },
    operators: { _state },
  }));
  const loadPageTypes = makeLoader({
    loadFullTypes,
    pageTypeModules: {
      one: async () => ({ actions: {}, blocks: { Box }, operators: {} }),
    },
    types,
  });
  // A Dynamic block resolved at page-get time brings a type the build did not
  // see on this page.
  await loadPageTypes({
    pageConfig: { type: 'Box', blocks: [{ type: 'Dynamic', blocks: [{ type: 'Card' }] }] },
    pageId: 'one',
  });
  expect(loadFullTypes).toHaveBeenCalledTimes(1);
  expect(types.blocks).toEqual({ Box, Button, Card });
});

test('createPageTypeLoader loads the full barrels only once', async () => {
  const types = makeTypes();
  const loadFullTypes = jest.fn(async () => ({
    actions: { Link },
    blocks: { Box },
    operators: { _state },
  }));
  const loadPageTypes = makeLoader({ loadFullTypes, pageTypeModules: {}, types });
  await loadPageTypes({ pageId: 'one' });
  await loadPageTypes({ pageId: 'two' });
  expect(loadFullTypes).toHaveBeenCalledTimes(1);
});

test('createPageTypeLoader falls back to the full barrels when a page chunk fails to load', async () => {
  const types = makeTypes();
  const loadFullTypes = jest.fn(async () => ({
    actions: { Link },
    blocks: { Box, Button, Card },
    operators: { _state },
  }));
  const loadPageTypes = makeLoader({
    loadFullTypes,
    pageTypeModules: {
      one: async () => {
        throw new Error('Failed to fetch dynamically imported module');
      },
    },
    types,
  });
  await loadPageTypes({ pageConfig: { type: 'Box' }, pageId: 'one' });
  expect(loadFullTypes).toHaveBeenCalledTimes(1);
  expect(types.blocks).toEqual({ Box, Button, Card });
});
