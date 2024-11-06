import { jest } from '@jest/globals';

import runRoutine from '../runRoutine.js';
import getOperatorsParser from '../getOperatorsParser.js';

// TODO: Use '../../../test/testContext.js' ?
function testContext({ payload }) {
  const context = {
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: console.error,
      // error: jest.fn(),
    },
    // TODO: Maybe import @lowdefy/operators-js/server
    operators: {
      _eq: ({ params }) => params[0] === params[1],
      _test_error: ({ params }) => {
        throw new Error(params);
        // TODO: _state
        // TODO: _payload
      },
    },
    jsMap: {},
    secrets: {
      TEST_SECRET: 'shhhhh',
    },
    user: {
      id: 'test_user_id',
    },
  };
  context.operatorsParser = getOperatorsParser(context, { payload });
  return context;
}

async function runTest({ routine, payload = {} }) {
  const context = testContext({ payload });
  const res = await runRoutine(context, { routine });
  return { res, context };
}

export default runTest;
