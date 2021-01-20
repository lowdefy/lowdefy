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

import checkChildProcessError from './checkChildProcessError';

const mockError = jest.fn();
const context = {
  print: {
    error: mockError,
  },
};

test('output status 0', () => {
  checkChildProcessError({ context, proccessOutput: { status: 0 }, message: 'Test Error Message' });
  // checkChildProcessError should not throw, expect is so that test passes
  expect(true).toBe(true);
});

test('output status 1', () => {
  const proccessOutput = {
    status: 1,
    stderr: Buffer.from('Process error message'),
  };
  expect(() =>
    checkChildProcessError({ context, proccessOutput, message: 'Test Error Message' })
  ).toThrow('Test Error Message');
  expect(mockError.mock.calls).toMatchInlineSnapshot(
    [['Process error message']],
    `
    Array [
      Array [
        "Process error message",
      ],
    ]
  `
  );
});
