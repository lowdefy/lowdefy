import { jest } from '@jest/globals';

import runTest from '../test/runTest.js';

test('single switch', async () => {
  const routine = {
    ':switch': [
      {
        ':case': true,
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
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('reject');
  expect(res.response).toEqual(true);
});
