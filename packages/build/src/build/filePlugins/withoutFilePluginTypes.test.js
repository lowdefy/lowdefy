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

import withoutFilePluginTypes from './withoutFilePluginTypes.js';

function filePlugin(relativePath) {
  return { package: null, packageId: 'file-plugin', relativePath };
}

test('withoutFilePluginTypes removes file-plugin definitions and keeps package definitions', () => {
  const typesMap = {
    blocks: {
      Card: { package: '@lowdefy/blocks-antd' },
      Panel: filePlugin('plugins/blocks/Panel.jsx'),
    },
    actions: { CopyRow: filePlugin('plugins/actions/CopyRow.js') },
    operators: {
      build: { _env: filePlugin('plugins/operators/build/_env.js') },
      client: {
        _if: { package: '@lowdefy/operators-js' },
        _slug: filePlugin('plugins/operators/shared/_slug.js'),
      },
      server: { _slug: filePlugin('plugins/operators/shared/_slug.js') },
    },
  };
  expect(withoutFilePluginTypes(typesMap)).toEqual({
    blocks: { Card: { package: '@lowdefy/blocks-antd' } },
    actions: {},
    operators: {
      build: {},
      client: { _if: { package: '@lowdefy/operators-js' } },
      server: {},
    },
  });
});

test('withoutFilePluginTypes does not mutate the typesMap it is given', () => {
  const typesMap = {
    blocks: { Panel: filePlugin('plugins/blocks/Panel.jsx') },
    operators: { client: { _slug: filePlugin('plugins/operators/client/_slug.js') } },
  };
  withoutFilePluginTypes(typesMap);
  expect(Object.keys(typesMap.blocks)).toEqual(['Panel']);
  expect(Object.keys(typesMap.operators.client)).toEqual(['_slug']);
});

test('withoutFilePluginTypes leaves stores the typesMap does not have alone', () => {
  expect(withoutFilePluginTypes({ blocks: { Card: { package: '@lowdefy/blocks-antd' } } })).toEqual(
    {
      blocks: { Card: { package: '@lowdefy/blocks-antd' } },
    }
  );
});

test('withoutFilePluginTypes returns a typesMap that is not an object unchanged', () => {
  expect(withoutFilePluginTypes(undefined)).toBeUndefined();
});

test('withoutFilePluginTypes drops a connectionMetas entry whose connection was a file plugin', () => {
  const typesMap = {
    connections: {
      MongoDBCollection: { package: '@lowdefy/connection-mongodb' },
      MemoryStore: filePlugin('plugins/connections/MemoryStore/MemoryStore.js'),
    },
    connectionMetas: {
      MongoDBCollection: { tenant: true },
      MemoryStore: { tenant: true },
    },
  };
  expect(withoutFilePluginTypes(typesMap)).toEqual({
    connections: { MongoDBCollection: { package: '@lowdefy/connection-mongodb' } },
    connectionMetas: { MongoDBCollection: { tenant: true } },
  });
  expect(typesMap.connectionMetas.MemoryStore).toEqual({ tenant: true });
});
