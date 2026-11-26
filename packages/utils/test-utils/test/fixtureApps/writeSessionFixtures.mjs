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

import fs from 'node:fs';
import path from 'node:path';

function writeArtifact({ serverDirectory, filePath, artifact }) {
  const target = path.join(serverDirectory, 'build', filePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(artifact));
}

function endpoint({ endpointId, routine, ...rest }) {
  return {
    id: `endpoint:${endpointId}`,
    type: 'Api',
    auth: { public: true },
    endpointId,
    routine,
    ...rest,
  };
}

function requestStep({ connectionId, endpointId, properties, stepId, type }) {
  return {
    id: `request:${endpointId}:${stepId}`,
    type,
    connectionId,
    properties,
    stepId,
    endpointId,
  };
}

// The plugin map of the copy: the fixture's MongoDB and HTTP types, the Anthropic type an agent
// reads, and TestLedger, a type that declares no meta.dataSet, as Knex or Redis do. A request
// that reaches one of TestLedger's real resolvers is noted on globalThis, so a test can show
// that none did.
const connectionsModule = `import { MongoDBCollection } from '@lowdefy/connection-mongodb/connections';
import { AxiosHttp } from '@lowdefy/connection-axios-http/connections';
import { Anthropic } from '@lowdefy/connection-anthropic/connections';

globalThis.testLedgerReached = globalThis.testLedgerReached ?? [];

function createResolver(requestType) {
  async function resolver({ request }) {
    globalThis.testLedgerReached.push({ requestType, request });
    return { real: true };
  }
  resolver.schema = { type: 'object' };
  resolver.meta = { checkRead: false, checkWrite: false };
  return resolver;
}

const TestLedger = {
  schema: { type: 'object' },
  requests: {
    TestLedgerQuery: createResolver('TestLedgerQuery'),
    TestLedgerPost: createResolver('TestLedgerPost'),
  },
};

export default { MongoDBCollection, AxiosHttp, Anthropic, TestLedger };
`;

// What the session suites need that apps/journey-fixture does not have, written into a copy of
// its build (copyFixtureApp), so the app and the journey suites that count its pages and
// endpoints stay as they are:
// - log_activity, which writes, is gated to the auditor role.
// - ledger is a connection of a type that declares no meta.dataSet, with a page request and an
//   endpoint for its two request types.
// - ask_helper calls an agent.
// - nightly is an InternalApi endpoint that writes who ran it.
// - slow_log is an async endpoint.
// - read_secrets returns secrets.
function writeSessionFixtures({ serverDirectory }) {
  const logActivityPath = path.join(serverDirectory, 'build', 'api', 'log_activity.json');
  const logActivity = JSON.parse(fs.readFileSync(logActivityPath, 'utf8'));
  logActivity.auth = { public: false, roles: ['auditor'] };
  fs.writeFileSync(logActivityPath, JSON.stringify(logActivity));

  fs.writeFileSync(
    path.join(serverDirectory, 'build', 'plugins', 'connections.js'),
    connectionsModule
  );
  writeArtifact({
    serverDirectory,
    filePath: 'connections/ledger.json',
    artifact: {
      id: 'connection:ledger',
      type: 'TestLedger',
      connectionId: 'ledger',
      properties: { host: 'ledger.internal', password: { _secret: 'LEDGER_PASSWORD' } },
    },
  });
  // A page request, so its answer is the request's own: the copy's operator map holds only the
  // operators the app uses, and none of them reads a step's result.
  writeArtifact({
    serverDirectory,
    filePath: 'pages/ledger/requests/query_ledger.json',
    artifact: {
      id: 'request:ledger:query_ledger',
      type: 'TestLedgerQuery',
      connectionId: 'ledger',
      properties: { account: { _payload: 'account' } },
      payload: {},
      auth: { public: true },
      requestId: 'query_ledger',
      pageId: 'ledger',
    },
  });
  writeArtifact({
    serverDirectory,
    filePath: 'api/post_ledger.json',
    artifact: endpoint({
      endpointId: 'post_ledger',
      routine: [
        requestStep({
          connectionId: 'ledger',
          endpointId: 'post_ledger',
          properties: { amount: { _payload: 'amount' } },
          stepId: 'post_entry',
          type: 'TestLedgerPost',
        }),
        { ':return': { posted: true } },
      ],
    }),
  });

  writeArtifact({
    serverDirectory,
    filePath: 'connections/model.json',
    artifact: {
      id: 'connection:model',
      type: 'Anthropic',
      connectionId: 'model',
      properties: { apiKey: { _secret: 'ANTHROPIC_API_KEY' } },
    },
  });
  writeArtifact({
    serverDirectory,
    filePath: 'agents/helper.json',
    artifact: {
      id: 'agent:helper',
      type: 'Agent',
      agentId: 'helper',
      connectionId: 'model',
      auth: { public: true },
      properties: { model: 'claude-haiku-4-5', system: 'Answer briefly.' },
    },
  });
  writeArtifact({
    serverDirectory,
    filePath: 'api/ask_helper.json',
    artifact: endpoint({
      endpointId: 'ask_helper',
      routine: [
        {
          id: 'agent:ask_helper:ask',
          type: 'CallAgent',
          stepId: 'ask',
          endpointId: 'ask_helper',
          properties: { agentId: 'helper', prompt: { _payload: 'question' } },
        },
        { ':return': { asked: true } },
      ],
    }),
  });

  writeArtifact({
    serverDirectory,
    filePath: 'api/nightly.json',
    artifact: endpoint({
      endpointId: 'nightly',
      type: 'InternalApi',
      auth: { public: false, roles: ['auditor'] },
      routine: [
        requestStep({
          connectionId: 'fixture_db',
          endpointId: 'nightly',
          properties: {
            doc: { kind: 'nightly', night: { _payload: 'night' }, ran_by: { _user: 'id' } },
          },
          stepId: 'insert_nightly',
          type: 'MongoDBInsertOne',
        }),
        { ':return': { ran: true } },
      ],
    }),
  });
  writeArtifact({
    serverDirectory,
    filePath: 'api/slow_log.json',
    artifact: endpoint({
      endpointId: 'slow_log',
      async: true,
      routine: [
        requestStep({
          connectionId: 'fixture_db',
          endpointId: 'slow_log',
          properties: { doc: { kind: 'slow' } },
          stepId: 'insert_slow',
          type: 'MongoDBInsertOne',
        }),
      ],
    }),
  });
  writeArtifact({
    serverDirectory,
    filePath: 'api/read_secrets.json',
    artifact: endpoint({
      endpointId: 'read_secrets',
      routine: [
        {
          ':return': {
            database: { _secret: 'FIXTURE_DATABASE_URI' },
            ledger: { _secret: 'LEDGER_PASSWORD' },
            unnamed: { _secret: { key: 'REPORTS_TOKEN', default: 'no token' } },
          },
        },
      ],
    }),
  });
}

export default writeSessionFixtures;
