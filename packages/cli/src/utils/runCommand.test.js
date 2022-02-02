/*
  Copyright 2020-2021 Lowdefy, Inc

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
// import { wait } from '@lowdefy/helpers';

// import errorHandler from './errorHandler.js';
// import runCommand from './runCommand.js';
// import startUp from './startUp.js';

// jest.mock('./errorHandler');
// jest.mock('./startUp');

// beforeEach(() => {
//   errorHandler.mockReset();
// });

// const options = { option: true };
// const command = {
//   command: true,
// };

// TODO: ora es module import failing

test.todo(
  'runCommand with synchronous function'
  /*async () => {
  const fn = jest.fn(() => 1 + 1);
  const wrapped = runCommand(fn);
  const res = await wrapped(options, command);
  expect(res).toBe(2);
  expect(fn).toHaveBeenCalled();
}*/
);

test.todo(
  'runCommand with asynchronous function' /*async () => {
  const fn = jest.fn(async () => {
    await wait(3);
    return 4;
  });
  const wrapped = runCommand(fn);
  const res = await wrapped(options, command);
  expect(res).toBe(4);
  expect(fn).toHaveBeenCalled();
}*/
);

test.todo(
  'runCommand calls startUp' /*async () => {
  const fn = jest.fn((...args) => args);
  const wrapped = runCommand(fn);
  const res = await wrapped(options, command);
  expect(res).toMatchInlineSnapshot(`
    Array [
      Object {
        "context": Object {
          "appId": "appId",
          "configDirectory": "configDirectory",
          "buildDirectory": "configDirectory/buildDirectory",
          "cacheDirectory": "configDirectory/cacheDirectory",
          "cliConfig": Object {},
          "cliVersion": "cliVersion",
          "command": "test",
          "commandLineOptions": Object {
            "option": true,
          },
          "lowdefyVersion": "lowdefyVersion",
          "options": Object {
            "option": true,
          },
          "print": Object {
            "info": [MockFunction],
            "log": [MockFunction],
            "succeed": [MockFunction],
          },
          "sendTelemetry": [MockFunction],
        },
      },
    ]
  `);
  expect(startUp.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "command": Object {
            "command": true,
          },
          "context": Object {
            "appId": "appId",
            "configDirectory": "configDirectory",
            "buildDirectory": "configDirectory/buildDirectory",
            "cacheDirectory": "configDirectory/cacheDirectory",
            "cliConfig": Object {},
            "cliVersion": "cliVersion",
            "command": "test",
            "commandLineOptions": Object {
              "option": true,
            },
            "lowdefyVersion": "lowdefyVersion",
            "options": Object {
              "option": true,
            },
            "print": Object {
              "info": [MockFunction],
              "log": [MockFunction],
              "succeed": [MockFunction],
            },
            "sendTelemetry": [MockFunction],
          },
          "options": Object {
            "option": true,
          },
        },
      ],
    ]
  `);
}*/
);

test.todo(
  'Catch error synchronous function' /*async () => {
  const fn = jest.fn(() => {
    throw new Error('Error');
  });
  const wrapped = runCommand(fn);
  await wrapped(options, command);
  expect(fn).toHaveBeenCalled();
  expect(errorHandler.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "context": Object {
            "appId": "appId",
            "configDirectory": "configDirectory",
            "buildDirectory": "configDirectory/buildDirectory",
            "cacheDirectory": "configDirectory/cacheDirectory",
            "cliConfig": Object {},
            "cliVersion": "cliVersion",
            "command": "test",
            "commandLineOptions": Object {
              "option": true,
            },
            "lowdefyVersion": "lowdefyVersion",
            "options": Object {
              "option": true,
            },
            "print": Object {
              "info": [MockFunction],
              "log": [MockFunction],
              "succeed": [MockFunction],
            },
            "sendTelemetry": [MockFunction],
          },
          "error": [Error: Error],
        },
      ],
    ]
  `);
}*/
);

test.todo(
  'Catch error asynchronous function' /*async () => {
  const fn = jest.fn(async () => {
    await wait(3);
    throw new Error('Async Error');
  });
  const wrapped = runCommand(fn);
  await wrapped(options, command);
  expect(fn).toHaveBeenCalled();
  expect(errorHandler.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "context": Object {
            "appId": "appId",
            "configDirectory": "configDirectory",
            "buildDirectory": "configDirectory/buildDirectory",
            "cacheDirectory": "configDirectory/cacheDirectory",
            "cliConfig": Object {},
            "cliVersion": "cliVersion",
            "command": "test",
            "commandLineOptions": Object {
              "option": true,
            },
            "lowdefyVersion": "lowdefyVersion",
            "options": Object {
              "option": true,
            },
            "print": Object {
              "info": [MockFunction],
              "log": [MockFunction],
              "succeed": [MockFunction],
            },
            "sendTelemetry": [MockFunction],
          },
          "error": [Error: Async Error],
        },
      ],
    ]
  `);
}*/
);
