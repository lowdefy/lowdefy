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

import { serializer } from '@lowdefy/helpers';

import applyDataSetRedirect from './applyDataSetRedirect.js';
import createMutantReadConfigFile from './mutants/createMutantReadConfigFile.js';
import { endpointFixture } from './mutants/test/fixtures.mjs';
import { openMutantRun } from './mutants/mutantRuns.js';

// A journey on a data set under a mutant has both read wrappers on its
// context: the data set redirect on connections/<id>.json and the mutant on
// its one artifact. They touch different artifacts, so the order they are
// stacked in must not matter.

const connections = { MongoDBCollection: { meta: { tenant: true, dataSet: 'redirect' } } };

const session = {
  id: 'session-1',
  name: 'shop',
  state: 'open',
  databaseUri: 'mongodb://127.0.0.1:27999/?replicaSet=rs',
  databaseName: 'ld_0123456789ab',
};

function setup() {
  const { root } = endpointFixture();
  const files = {
    'api/notify.json': serializer.serializeToString(root),
    'connections/tickets.json': serializer.serializeToString({
      id: 'connection:tickets',
      connectionId: 'tickets',
      type: 'MongoDBCollection',
      properties: { databaseUri: { _secret: 'MONGODB_URI' }, collection: 'tickets', write: true },
    }),
  };
  async function readConfigFile(filePath) {
    return serializer.deserializeFromString(files[filePath] ?? 'null');
  }
  const opened = openMutantRun({
    mutant: {
      buildId: 'build-1',
      artifact: 'api/notify.json',
      key: root.routine[0]['~k'],
      arg: null,
      operator: 'drop-step',
    },
  });
  return { opened, readConfigFile };
}

function stackDataThenMutant({ readConfigFile, run }) {
  const context = { readConfigFile };
  applyDataSetRedirect({ context, session, connections });
  context.readConfigFile = createMutantReadConfigFile({
    readConfigFile: context.readConfigFile,
    run,
  });
  return context.readConfigFile;
}

function stackMutantThenData({ readConfigFile, run }) {
  const context = { readConfigFile: createMutantReadConfigFile({ readConfigFile, run }) };
  applyDataSetRedirect({ context, session, connections });
  return context.readConfigFile;
}

async function readBoth(stack) {
  const { opened, readConfigFile } = setup();
  const read = stack({ readConfigFile, run: opened.run });
  const result = {
    endpoint: await read('api/notify.json'),
    connection: await read('connections/tickets.json'),
    applied: opened.run.applied,
    misses: opened.run.misses,
  };
  opened.close();
  return result;
}

test('the data set redirect and the mutant wrapper give the same reads stacked in either order', async () => {
  const dataFirst = await readBoth(stackDataThenMutant);
  const mutantFirst = await readBoth(stackMutantThenData);
  expect(mutantFirst).toEqual(dataFirst);

  expect(dataFirst.applied).toBe(1);
  expect(dataFirst.misses).toEqual([]);
  expect(dataFirst.endpoint.routine.map((step) => step.stepId ?? Object.keys(step)[0])).toEqual([
    ':if',
    ':if',
    ':return',
  ]);
  expect(dataFirst.connection.properties).toEqual({
    databaseUri: session.databaseUri,
    databaseName: session.databaseName,
    collection: 'tickets',
    write: true,
  });
});
