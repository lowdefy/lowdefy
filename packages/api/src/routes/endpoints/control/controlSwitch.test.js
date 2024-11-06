import { jest } from '@jest/globals';

import runTest from '../test/runTest.js';

test('single switch case', async () => {
  const routine = {
    ':switch': [
      {
        ':case': false,
        ':then': [
          {
            id: 'request:test_endpoint:test_request_true',
            type: 'TestRequest',
            connectionId: 'test',
            properties: {
              response: 'Was true',
            },
          },
        ],
      },
    ],
    ':default': [{ ':return': { message: 'default case' } }],
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ message: 'default case' });
});
