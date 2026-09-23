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
import { wait } from '@lowdefy/helpers';
import { operatorsServer } from '@lowdefy/operators-js';

import createEvaluateOperators from '../../../context/createEvaluateOperators.js';
import runRoutine from '../runRoutine.js';
import testContext from '../../../test/testContext.js';

// const { _date, _eq, _payload, _secret, _user } = operatorsServer;

const operators = {
  ...operatorsServer,
  _throw_test: () => {
    throw new Error('Test error.');
  },
};
const secrets = {
  CONNECTION: 'connectionSecret',
  REQUEST: 'requestSecret',
};
const defaultReadConfigImp =
  ({
    connectionConfig = {
      id: 'connection:test',
      type: 'TestConnection',
      connectionId: 'test',
    },
  } = {}) =>
  (path) => {
    if (path === 'connections/test.json') {
      return connectionConfig;
    }
    return null;
  };

const mockReadConfigFile = jest.fn().mockImplementation(defaultReadConfigImp());
const mockTestRequest = jest.fn((request) => {
  return request.request.response;
});
const mockTestRequestError = jest.fn((request) => {
  throw new Error(request.request.message);
});
const mockTestRequestWait = jest.fn((request) => wait(request.request.ms));

mockTestRequest.schema = {};
mockTestRequestError.schema = {};
mockTestRequestWait.schema = {};

mockTestRequest.meta = {
  checkRead: false,
  checkWrite: false,
};
mockTestRequestError.meta = {
  checkRead: false,
  checkWrite: false,
};
mockTestRequestWait.meta = {
  checkRead: false,
  checkWrite: false,
};

const connections = {
  TestConnection: {
    schema: {},
    requests: {
      TestRequest: mockTestRequest,
      TestRequestError: mockTestRequestError,
      TestRequestWait: mockTestRequestWait,
    },
  },
};

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // error: console.error,
  error: jest.fn(),
};

function createTextContext() {
  const context = testContext({
    connections,
    operators,
    logger,
    readConfigFile: mockReadConfigFile,
    secrets,
    session: { user: { id: 'id' } },
  });
  context.blockId = 'blockId';
  context.pageId = 'pageId';
  context.endpointId = 'endpointId';
  context.evaluateOperators = createEvaluateOperators(context);

  return context;
}
async function runTest({ routine, payload = {} }) {
  const context = createTextContext();
  const routineContext = {
    steps: {},
    payload,
    error: null,
    items: {},
    arrayIndices: [],
    state: {},
    endpointDepth: 0,
  };
  const res = await runRoutine(context, routineContext, { routine });
  return { res, context, routineContext };
}

export default runTest;
