import { jest } from '@jest/globals';
import { wait } from '@lowdefy/helpers';
import { operatorsServer } from '@lowdefy/operators-js';

import createEvaluateOperators from '../../../context/createEvaluateOperators.js';
import runRoutine from '../runRoutine.js';
import testContext from '../../../test/testContext.js';

// const { _date, _eq, _payload, _secret, _user } = operatorsServer;

const operators = {
  ...operatorsServer,
  _error: () => {
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

function createTextContext({ payload }) {
  const context = testContext({
    connections,
    operators,
    logger,
    readConfigFile: mockReadConfigFile,
    secrets,
    session: { user: { id: 'id' } },
  });
  context.payload = payload;
  context.steps = {};
  context.blockId = 'blockId';
  context.pageId = 'pageId';
  context.endpointId = 'endpointId';
  context.evaluateOperators = createEvaluateOperators(context, { payload });

  return context;
}
async function runTest({ routine, payload = {} }) {
  const context = createTextContext({ payload });
  const routineContext = {
    items: {},
    arrayIndices: [],
  };
  const res = await runRoutine(context, routineContext, { routine });
  return { res, context };
}

export default runTest;
