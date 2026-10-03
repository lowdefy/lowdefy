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

import defaultPackages from './defaultPackages.js';

// Under a journey data set the dev server lets a connection run only when its type declares
// meta.dataSet: 'redirect' (it takes the session's databaseUri and databaseName) or 'external' (an
// outside service). Every other type refuses. These core types hold app data the dev server cannot
// redirect, so they refuse on purpose. A new core connection type must either declare meta.dataSet
// or be added here.
const refusedTypes = [
  'AwsS3Bucket',
  'AzureBlobContainer',
  'Elasticsearch',
  'GoogleCloudStorageBucket',
  'GoogleSheet',
  'Knex',
  'Redis',
  'TestConnection',
];

async function readCoreConnectionTypes() {
  const connectionTypes = {};
  for (const packageName of defaultPackages) {
    const { default: types } = await import(`${packageName}/types`);
    if ((types.connections ?? []).length === 0) continue;
    const connections = await import(`${packageName}/connections`);
    types.connections.forEach((typeName) => {
      connectionTypes[typeName] = connections[typeName];
    });
  }
  return connectionTypes;
}

test('every core connection type declares meta.dataSet or is on the refused list', async () => {
  const connectionTypes = await readCoreConnectionTypes();
  const undeclared = Object.keys(connectionTypes)
    .filter(
      (typeName) => !['redirect', 'external'].includes(connectionTypes[typeName].meta?.dataSet)
    )
    .sort();
  expect(undeclared).toEqual(refusedTypes);
});

test('MongoDBCollection is the core connection type redirected under a data set', async () => {
  const connectionTypes = await readCoreConnectionTypes();
  const redirected = Object.keys(connectionTypes).filter(
    (typeName) => connectionTypes[typeName].meta?.dataSet === 'redirect'
  );
  expect(redirected).toEqual(['MongoDBCollection']);
});
