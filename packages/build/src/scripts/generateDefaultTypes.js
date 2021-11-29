#!/usr/bin/env node
/*
  Copyright 2020-2021 Lowdefy, Inc

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

import path from 'path';
import { type } from '@lowdefy/helpers';
import { readFile, writeFile } from '@lowdefy/node-utils';

const defaultPackages = [
  '@lowdefy/blocks-antd',
  '@lowdefy/blocks-basic',
  // '@lowdefy/blocks-color-selectors',
  // '@lowdefy/blocks-echarts',
  '@lowdefy/blocks-loaders',
  // '@lowdefy/blocks-markdown',
  '@lowdefy/connection-axios-http',
  '@lowdefy/operators-js',
  '@lowdefy/operators-nunjucks',
];

function createTypeDefinitions({ typeNames, store, packageName, version }) {
  if (type.isArray(typeNames)) {
    typeNames.forEach((typeName) => {
      store[typeName] = {
        package: packageName,
        version,
      };
    });
  }
}

async function generateDefaultTypes() {
  const packageFile = JSON.parse(await readFile(path.resolve(process.cwd(), './package.json')));
  const defaultTypes = {
    actions: {},
    blocks: {},
    connections: {},
    requests: {},
    operators: {
      client: {},
      server: {},
    },
    styles: {},
  };

  await Promise.all(
    defaultPackages.map(async (packageName) => {
      const { default: types } = await import(`${packageName}/types`);
      const version = packageFile.devDependencies[packageName];

      createTypeDefinitions({
        typeNames: types.actions,
        store: defaultTypes.actions,
        packageName,
        version,
      });

      createTypeDefinitions({
        typeNames: types.blocks,
        store: defaultTypes.blocks,
        packageName,
        version,
      });

      createTypeDefinitions({
        typeNames: types.connections,
        store: defaultTypes.connections,
        packageName,
        version,
      });

      createTypeDefinitions({
        typeNames: types.requests,
        store: defaultTypes.requests,
        packageName,
        version,
      });

      createTypeDefinitions({
        typeNames: type.isObject(types.operators) ? types.operators.client : [],
        store: defaultTypes.operators.client,
        packageName,
        version,
      });

      createTypeDefinitions({
        typeNames: type.isObject(types.operators) ? types.operators.server : [],
        store: defaultTypes.operators.server,
        packageName,
        version,
      });

      if (type.isObject(types.styles)) {
        defaultTypes.styles[packageName] = types.styles;
      }
    })
  );

  await writeFile({
    filePath: path.resolve(process.cwd(), './dist/defaultTypes.json'),
    content: JSON.stringify(defaultTypes, null, 2),
  });
}

generateDefaultTypes();
