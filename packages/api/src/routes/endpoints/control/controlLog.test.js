/*
  Copyright 2020-2024 Lowdefy, Inc

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

import runTest from '../test/runTest.js';

test('basic info log', async () => {
  const routine = {
    ':log': {
      message: 'Testing log info',
    },
    ':level': 'info',
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toEqual([[{ event: 'debug_control_log' }]]);
  expect(context.logger.info.mock.calls).toEqual([[{ message: 'Testing log info' }]]);
});

test('basic warn log', async () => {
  const routine = {
    ':log': {
      message: 'Testing log warn',
    },
    ':level': 'warn',
  };
  const { res, context } = await runTest({ routine });

  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toEqual([[{ event: 'debug_control_log' }]]);
  expect(context.logger.warn.mock.calls).toEqual([[{ message: 'Testing log warn' }]]);
});

test('basic error log', async () => {
  const routine = {
    ':log': {
      message: 'Testing log error',
    },
    ':level': 'error',
  };
  const { res, context } = await runTest({ routine });

  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toEqual([[{ event: 'debug_control_log' }]]);
  expect(context.logger.error.mock.calls).toEqual([[{ message: 'Testing log error' }]]);
});

test('log is not a string', async () => {
  const routine = {
    ':log': true,
  };
  const { res, context } = await runTest({ routine });

  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toEqual([[{ event: 'debug_control_log' }]]);
  expect(context.logger.info.mock.calls).toEqual([[true]]);
});

test('log level is not a string', async () => {
  const routine = {
    ':log': {
      message: 'Testing log invalid level type',
    },
    ':level': true,
  };
  const { res, context } = await runTest({ routine });

  expect(res.status).toEqual('error');
  expect(res.error).toEqual(
    new Error('Invalid :log in endpoint "endpointId" - :level must be a string. Received true.')
  );
  expect(context.logger.debug.mock.calls).toEqual([[{ event: 'debug_control_log' }]]);
});

test('invalid log level', async () => {
  const routine = {
    ':log': {
      message: 'Testing log invalid level',
    },
    ':level': 'none',
  };
  const { res, context } = await runTest({ routine });

  expect(res.status).toEqual('error');
  expect(res.error).toEqual(
    new Error('Invalid :log in endpoint "endpointId" - unrecognised log level. Received "none".')
  );
  expect(context.logger.debug.mock.calls).toEqual([[{ event: 'debug_control_log' }]]);
});

test('basic info log with string', async () => {
  const routine = {
    ':log': 'Testing log info string',
    ':level': 'info',
  };
  const { res, context } = await runTest({ routine });

  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toEqual([[{ event: 'debug_control_log' }]]);
  expect(context.logger.info.mock.calls).toEqual([['Testing log info string']]);
});

test('default log level', async () => {
  const routine = {
    ':log': { message: 'Testing log default level' },
  };
  const { res, context } = await runTest({ routine });

  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toEqual([[{ event: 'debug_control_log' }]]);
  expect(context.logger.info.mock.calls).toEqual([[{ message: 'Testing log default level' }]]);
});

test('multiple logs', async () => {
  const routine = [
    {
      ':log': { message: 'Info test' },
      ':level': 'info',
    },
    {
      ':log': { message: 'Warning test' },
      ':level': 'warn',
    },
    {
      ':log': { message: 'Error test' },
      ':level': 'error',
    },
    {
      ':log': { message: 'Warning test 2' },
      ':level': 'warn',
    },
  ];
  const { res, context } = await runTest({ routine });

  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_log' }],
    [{ event: 'debug_control_log' }],
    [{ event: 'debug_control_log' }],
    [{ event: 'debug_control_log' }],
  ]);
  expect(context.logger.info.mock.calls).toEqual([[{ message: 'Info test' }]]);
  expect(context.logger.warn.mock.calls).toEqual([
    [{ message: 'Warning test' }],
    [{ message: 'Warning test 2' }],
  ]);
  expect(context.logger.error.mock.calls).toEqual([[{ message: 'Error test' }]]);
});

test('evaluate operators log message', async () => {
  const routine = [
    {
      ':log': { message: { '_string.toUpperCase': 'uppercase log message' } },
      ':level': 'info',
    },
  ];
  const { res, context } = await runTest({ routine });

  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toEqual([[{ event: 'debug_control_log' }]]);
  expect(context.logger.info.mock.calls).toEqual([[{ message: 'UPPERCASE LOG MESSAGE' }]]);
});

test('evaluate operators log level', async () => {
  const routine = [
    {
      ':log': { message: 'Test log level evaluate operators' },
      ':level': { '_string.toLowerCase': 'INFO' },
    },
  ];
  const { res, context } = await runTest({ routine });

  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toEqual([[{ event: 'debug_control_log' }]]);
  expect(context.logger.info.mock.calls).toEqual([
    [{ message: 'Test log level evaluate operators' }],
  ]);
});
