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

const mockPost = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: { post: mockPost },
}));

const journey = {
  name: 'submits the form',
  pageId: 'form',
  user: { roles: ['admin'] },
  urlQuery: { tab: 'new' },
  steps: [{ fill: { blockId: 'title', value: 'x' } }, { click: 'submit' }],
};
const item = { filePath: '/app/tests/journeys/form.yaml', journey };
const url = 'http://localhost:3228';

test('runJourney posts the journey to the REST route and reports a pass', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  mockPost.mockResolvedValue({
    data: { pageId: 'form', passed: true, steps: [{}, {}], state: {} },
  });
  const result = await runJourney({ item, url });
  expect(mockPost).toHaveBeenCalledWith('http://localhost:3228/lowdefy-docs/journey', {
    pageId: 'form',
    steps: journey.steps,
    user: { roles: ['admin'] },
    urlQuery: { tab: 'new' },
  });
  expect(result).toMatchObject({
    name: 'submits the form',
    filePath: item.filePath,
    passed: true,
    stepCount: 2,
  });
  expect(result.durationMs).toEqual(expect.any(Number));
});

test('runJourney returns the failure from a failed journey response', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  const failure = {
    index: 1,
    step: { click: 'submit' },
    expected: 'block "submit" to be actionable',
    actual: 'Timeout 5000ms exceeded.',
    message: 'Step 1 failed.',
  };
  mockPost.mockResolvedValue({ data: { pageId: 'form', passed: false, failure, steps: [] } });
  const result = await runJourney({ item, url });
  expect(result).toMatchObject({ passed: false, failure, message: 'Step 1 failed.' });
});

test('runJourney reports a response carrying error as a failure', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  mockPost.mockResolvedValue({ data: { error: 'Page "form" not found.' } });
  const result = await runJourney({ item, url });
  expect(result).toMatchObject({ passed: false, message: 'Page "form" not found.' });
});

test('runJourney reports a non-2xx response with its status and body', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  const error = new Error('Request failed with status code 400');
  error.response = { status: 400, data: { error: 'The "user" param must be an object.' } };
  mockPost.mockRejectedValue(error);
  const result = await runJourney({ item, url });
  expect(result).toMatchObject({
    passed: false,
    message:
      'POST /lowdefy-docs/journey responded 400: {"error":"The \\"user\\" param must be an object."}',
  });
});

test('runJourney reports a transport failure with the error message', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  mockPost.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:3228'));
  const result = await runJourney({ item, url });
  expect(result).toMatchObject({
    passed: false,
    message: 'Could not reach the dev server: connect ECONNREFUSED 127.0.0.1:3228',
  });
});

test('runJourney reports an invalid journey without calling the server', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  const result = await runJourney({
    item: { filePath: '/app/tests/journeys/bad.yaml', journey: { name: 'bad', pageId: 'p' } },
    url,
  });
  expect(mockPost).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    name: 'bad',
    passed: false,
    stepCount: 0,
    message: 'Invalid journey file: Journey should have required property "steps".',
  });
});

test('runJourney reports a file that failed to parse using its file path as the name', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  const result = await runJourney({
    item: { filePath: '/app/tests/journeys/broken.yaml', error: 'Invalid YAML: boom' },
    url,
  });
  expect(mockPost).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    name: '/app/tests/journeys/broken.yaml',
    passed: false,
    message: 'Invalid YAML: boom',
  });
});
