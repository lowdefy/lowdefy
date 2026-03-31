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

import collectSkeletonSourceFiles from './collectSkeletonSourceFiles.js';

function setRefMarker(obj, refId) {
  Object.defineProperty(obj, '~r', {
    value: refId,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  return obj;
}

test('collects paths from API endpoint refs', () => {
  const endpoint = setRefMarker({ id: 'ep1', type: 'ApiEndpoint' }, 'ref-ep1');
  const components = {
    api: [endpoint],
  };
  const context = {
    refMap: {
      'ref-ep1': { parent: 'ref-root', path: 'api/endpoint.yaml' },
      'ref-root': { parent: null, path: 'lowdefy.yaml' },
    },
  };
  const result = collectSkeletonSourceFiles({ components, context });
  expect(result).toEqual(new Set(['api/endpoint.yaml', 'lowdefy.yaml']));
});

test('walks parent chain to collect all contributing paths', () => {
  const step = setRefMarker({ action: 'validate' }, 'ref-step');
  const endpoint = setRefMarker({ id: 'ep1', steps: [step] }, 'ref-ep1');
  const components = {
    api: [endpoint],
  };
  const context = {
    refMap: {
      'ref-step': { parent: 'ref-ep1', path: 'steps/validate.yaml' },
      'ref-ep1': { parent: 'ref-root', path: 'api/my-endpoint.yaml' },
      'ref-root': { parent: null, path: 'lowdefy.yaml' },
    },
  };
  const result = collectSkeletonSourceFiles({ components, context });
  expect(result).toEqual(
    new Set(['steps/validate.yaml', 'api/my-endpoint.yaml', 'lowdefy.yaml'])
  );
});

test('excludes refs under pages key', () => {
  const page = setRefMarker({ id: 'page1', type: 'PageHeaderMenu' }, 'ref-page');
  const endpoint = setRefMarker({ id: 'ep1' }, 'ref-ep1');
  const components = {
    pages: [page],
    api: [endpoint],
  };
  const context = {
    refMap: {
      'ref-page': { parent: 'ref-root', path: 'pages/my-page.yaml' },
      'ref-ep1': { parent: 'ref-root', path: 'api/endpoint.yaml' },
      'ref-root': { parent: null, path: 'lowdefy.yaml' },
    },
  };
  const result = collectSkeletonSourceFiles({ components, context });
  expect(result.has('api/endpoint.yaml')).toBe(true);
  expect(result.has('lowdefy.yaml')).toBe(true);
  expect(result.has('pages/my-page.yaml')).toBe(false);
});

test('collects refs from multiple non-page keys', () => {
  const endpoint = setRefMarker({ id: 'ep1' }, 'ref-ep1');
  const conn = setRefMarker({ id: 'mongo' }, 'ref-conn');
  const auth = setRefMarker({ providers: [] }, 'ref-auth');
  const menu = setRefMarker({ id: 'main' }, 'ref-menu');
  const components = {
    api: [endpoint],
    connections: [conn],
    auth,
    menus: [menu],
  };
  const context = {
    refMap: {
      'ref-ep1': { parent: null, path: 'api/endpoint.yaml' },
      'ref-conn': { parent: null, path: 'connections/mongo.yaml' },
      'ref-auth': { parent: null, path: 'auth/providers.yaml' },
      'ref-menu': { parent: null, path: 'menus/main.yaml' },
    },
  };
  const result = collectSkeletonSourceFiles({ components, context });
  expect(result).toEqual(
    new Set([
      'api/endpoint.yaml',
      'connections/mongo.yaml',
      'auth/providers.yaml',
      'menus/main.yaml',
    ])
  );
});

test('skips refMap entries with no path but continues walking parents', () => {
  // Resolver refs have path: null but still have a parent
  const endpoint = setRefMarker({ id: 'ep1' }, 'ref-resolver');
  const components = {
    api: [endpoint],
  };
  const context = {
    refMap: {
      'ref-resolver': { parent: 'ref-root', path: null },
      'ref-root': { parent: null, path: 'lowdefy.yaml' },
    },
  };
  const result = collectSkeletonSourceFiles({ components, context });
  expect(result.has('lowdefy.yaml')).toBe(true);
  expect(result.size).toBe(1);
});

test('collects shared ref found via non-page walk even if also under pages', () => {
  const apiObj = setRefMarker({ id: 'shared' }, 'ref-shared');
  const pageObj = setRefMarker({ id: 'page1' }, 'ref-shared');
  const components = {
    api: [apiObj],
    pages: [pageObj],
  };
  const context = {
    refMap: {
      'ref-shared': { parent: null, path: 'shared/config.yaml' },
    },
  };
  const result = collectSkeletonSourceFiles({ components, context });
  expect(result).toEqual(new Set(['shared/config.yaml']));
});

test('returns empty set for components with no non-page keys', () => {
  const page = setRefMarker({ id: 'page1' }, 'ref-page');
  const components = {
    pages: [page],
  };
  const context = {
    refMap: {
      'ref-page': { parent: null, path: 'pages/my-page.yaml' },
    },
  };
  const result = collectSkeletonSourceFiles({ components, context });
  expect(result.size).toBe(0);
});

test('returns empty set for empty components', () => {
  const components = {};
  const context = { refMap: {} };
  const result = collectSkeletonSourceFiles({ components, context });
  expect(result.size).toBe(0);
});

test('finds deeply nested refs', () => {
  const deep = setRefMarker({ value: 'secret' }, 'ref-deep');
  const components = {
    auth: {
      providers: [
        {
          options: {
            nested: {
              config: deep,
            },
          },
        },
      ],
    },
  };
  const context = {
    refMap: {
      'ref-deep': { parent: null, path: 'auth/deep-config.yaml' },
    },
  };
  const result = collectSkeletonSourceFiles({ components, context });
  expect(result).toEqual(new Set(['auth/deep-config.yaml']));
});

test('descendant scan catches scalar-resolving refs', () => {
  // ref-scalar resolved to a string, so no ~r marker in the tree.
  // Its parent chain reaches ref-ep1 which IS in refIds.
  const endpoint = setRefMarker({ id: 'ep1', name: 'My Endpoint' }, 'ref-ep1');
  const components = {
    api: [endpoint],
  };
  const context = {
    refMap: {
      'ref-ep1': { parent: 'ref-root', path: 'api/endpoint.yaml' },
      'ref-root': { parent: null, path: 'lowdefy.yaml' },
      'ref-scalar': { parent: 'ref-ep1', path: 'api/name.yaml' },
    },
  };
  const result = collectSkeletonSourceFiles({ components, context });
  expect(result.has('api/name.yaml')).toBe(true);
  expect(result.has('api/endpoint.yaml')).toBe(true);
  expect(result.has('lowdefy.yaml')).toBe(true);
});

test('descendant scan excludes scalar refs whose parent chain only reaches page refs', () => {
  const page = setRefMarker({ id: 'page1' }, 'ref-page');
  const components = {
    pages: [page],
  };
  const context = {
    refMap: {
      'ref-page': { parent: 'ref-root', path: 'pages/my-page.yaml' },
      'ref-root': { parent: null, path: 'lowdefy.yaml' },
      'ref-page-scalar': { parent: 'ref-page', path: 'pages/title.yaml' },
    },
  };
  const result = collectSkeletonSourceFiles({ components, context });
  // No non-page keys, so refIds is empty. Descendant scan finds no ancestor in refIds.
  expect(result.size).toBe(0);
});
