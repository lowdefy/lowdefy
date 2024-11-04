import { jest } from '@jest/globals';

import runRoutine from '../runRoutine.js';

function testContext() {
  return {
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  };
}

async function runTest({ routine }) {
  const context = testContext();
  const res = await runRoutine(context, { routine });
  return { res, context };
}

export default runTest;
