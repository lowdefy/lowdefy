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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { buildBlockSchema } from '@lowdefy/block-utils';
import { beforeAll, describe, expect, test } from 'vitest';

import createDefaultTypesMap from './createDefaultTypesMap.js';
import defaultPackages from '../defaultPackages.js';
import importPluginModule from '../build/writePluginImports/importPluginModule.js';

const packageFile = JSON.parse(
  fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json'),
    'utf8'
  )
);

// Resolved as the build resolves a plugin module; undefined when not exported.
function importOptional(specifier) {
  return importPluginModule({ context: {}, specifier });
}

describe('createDefaultTypesMap with the real default packages', () => {
  let typesMap;

  beforeAll(async () => {
    typesMap = await createDefaultTypesMap({ packageFile, packageNames: defaultPackages });
  }, 120000);

  test('holds the schema of every default action, operator and block type that has one in its package', async () => {
    const expected = { actions: {}, blocks: {}, operators: {} };
    for (const packageName of defaultPackages) {
      const { default: types } = await import(`${packageName}/types`);
      const schemas = await importOptional(`${packageName}/schemas`);
      const metas = (await importOptional(`${packageName}/metas`)) ?? schemas;
      // A type name a later package registers again belongs to that package.
      const owns = (kind, typeName) => typesMap[kind][typeName]?.package === packageName;
      (types.actions ?? []).forEach((typeName) => {
        if (schemas?.[typeName] && owns('actions', typeName)) {
          expected.actions[typeName] = { package: packageName, schema: schemas[typeName] };
        }
      });
      for (const side of ['client', 'server']) {
        (types.operators?.[side] ?? []).forEach((typeName) => {
          if (schemas?.[typeName] && typesMap.operators[side][typeName].package === packageName) {
            expected.operators[typeName] = { package: packageName, schema: schemas[typeName] };
          }
        });
      }
      (types.blocks ?? []).forEach((typeName) => {
        const meta = metas?.[typeName];
        if (meta && owns('blocks', typeName)) {
          expected.blocks[typeName] = {
            package: packageName,
            schema: buildBlockSchema(meta),
            hazards: meta.hazards,
          };
        }
      });
    }
    expect(Object.keys(expected.actions).length).toBeGreaterThan(0);
    expect(Object.keys(expected.blocks).length).toBeGreaterThan(0);
    expect(Object.keys(expected.operators).length).toBeGreaterThan(0);
    expect(typesMap.schemas).toEqual(expected);
  });

  test('holds only schemas that survive the JSON the generated map is written as', () => {
    expect(JSON.parse(JSON.stringify(typesMap.schemas))).toEqual(typesMap.schemas);
  });

  test('every default block with a schema has types map block metas', () => {
    // writeBlockSchemaMap takes a block's category from the types map's
    // blockMetas, and only its hazards from the meta shipped here.
    Object.keys(typesMap.schemas.blocks).forEach((typeName) => {
      expect(typesMap.blockMetas[typeName]).toBeDefined();
    });
  });

  test('records which default packages export ./checks', () => {
    expect(Object.keys(typesMap.hasChecks).sort()).toEqual([...defaultPackages].sort());
    expect(
      Object.entries(typesMap.hasChecks)
        .filter(([, hasChecks]) => hasChecks)
        .map(([packageName]) => packageName)
    ).toEqual(['@lowdefy/operators-js']);
  });
});

test('createDefaultTypesMap fails when a default package that exports ./checks is not a dependency of @lowdefy/build', async () => {
  await expect(
    createDefaultTypesMap({
      packageFile: {
        dependencies: {},
        devDependencies: {
          '@lowdefy/operators-js': packageFile.dependencies['@lowdefy/operators-js'],
        },
      },
      packageNames: ['@lowdefy/operators-js'],
    })
  ).rejects.toThrow(
    'Default plugin package @lowdefy/operators-js exports ./checks but is not in the dependencies of @lowdefy/build.'
  );
}, 60000);
