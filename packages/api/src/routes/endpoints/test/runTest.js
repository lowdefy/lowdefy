import { jest } from '@jest/globals';
import { wait } from '@lowdefy/helpers';
import { operatorsServer } from '@lowdefy/operators-js';

import runRoutine from '../runRoutine.js';
// import getOperatorsParser from '../getOperatorsParser.js';
import createEvaluateOperators from '../../../context/createEvaluateOperators.js';
import testContext from '../../../test/testContext.js';
const { _date, _eq, _payload, _secret, _user } = operatorsServer;

const operators = {
  _date,
  _eq,
  _payload,
  _secret,
  _user,
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
      id: 'connection:testConnection',
      type: 'TestConnection',
      connectionId: 'testConnection',
      properties: {
        connectionProperty: 'connectionProperty',
      },
    },
    // requestConfig = {
    //   id: 'request:pageId:requestId',
    //   type: 'TestRequest',
    //   requestId: 'requestId',
    //   pageId: 'pageId',
    //   connectionId: 'testConnection',
    //   auth: { public: true },
    //   properties: {
    //     requestProperty: 'requestProperty',
    //   },
    // },
  } = {}) =>
  (path) => {
    if (path === 'connections/testConnection.json') {
      return connectionConfig;
    }
    // if (path === 'pages/pageId/requests/requestId.json') {
    //   return requestConfig;
    // }
    return null;
  };

const defaultResolverImp = ({ request, connection }) => ({
  request,
  connection,
});
const mockReadConfigFile = jest.fn().mockImplementation(defaultReadConfigImp());
const mockTestRequest = jest
  .fn((properties) => {
    return properties.response;
  })
  .mockImplementation(defaultResolverImp);
const mockTestRequestError = jest
  .fn((properties) => {
    throw new Error(properties.message);
  })
  .mockImplementation(defaultResolverImp);
const mockTestRequestWait = jest
  .fn((properties) => wait(properties.ms))
  .mockImplementation(defaultResolverImp);

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
    schema: {
      type: 'object',
      properties: {
        schemaPropString: {
          type: 'string',
        },
      },
    },
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
  context.blockId = 'blockId';
  context.pageId = 'pageId';
  context.endpointId = 'endpointId';
  context.evaluateOperators = createEvaluateOperators(context, { payload });

  return context;
}
// TODO: Use '../../../test/testContext.js' ?
// function testContext({ payload }) {
//   const context = {
//     logger: {
//       debug: jest.fn(),
//       info: jest.fn(),
//       warn: jest.fn(),
//       // error: console.error,
//       error: jest.fn(),
//     },
//     // TODO: Maybe import @lowdefy/operators-js/server
//     operators: {
//       _eq: ({ params }) => params[0] === params[1],
//       _test_error: ({ params }) => {
//         throw new Error(params);
//         // TODO: _state
//         // TODO: _payload
//       },
//     },
//     jsMap: {},
//     secrets: {
//       TEST_SECRET: 'shhhhh',
//     },
//     user: {
//       id: 'test_user_id',
//     },
//   };
//   context.operatorsParser = getOperatorsParser(context, { payload });
//   return context;
// }

async function runTest({ routine, payload = {} }) {
  const context = createTextContext({ payload });
  const routineContext = {
    items: {},
  };
  const res = await runRoutine(context, routineContext, { routine });
  console.log({ res });
  return { res, context };
}

export default runTest;
