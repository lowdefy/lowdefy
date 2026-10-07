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

const mockConnect = jest.fn();
const mockBuildConnector = jest.fn(() => mockConnect);

jest.unstable_mockModule('undici', () => ({
  buildConnector: (...args) => mockBuildConnector(...args),
}));

const { default: createConnectPublic } = await import('./createConnectPublic.js');

function createNotPublicError(hostname) {
  const error = new Error(`Link to ${hostname} leads to an address that is not public.`);
  error.code = 'url_not_public';
  return error;
}

function run(connectPublic, hostname) {
  return new Promise((resolve) => {
    mockConnect.mockImplementation((options, callback) => callback(null, 'socket'));
    connectPublic({ hostname }, (...result) => resolve(result));
  });
}

test('createConnectPublic builds the connector with a lookup that checks addresses', () => {
  createConnectPublic({ createNotPublicError });
  expect(typeof mockBuildConnector.mock.calls[0][0].lookup).toBe('function');
});

test('createConnectPublic refuses an IP literal that is not public before connecting', async () => {
  const connectPublic = createConnectPublic({ createNotPublicError });
  const [error, socket] = await run(connectPublic, '169.254.169.254');
  expect(error.code).toBe('url_not_public');
  expect(error.message).toBe('Link to 169.254.169.254 leads to an address that is not public.');
  expect(socket).toBe(null);
  expect(mockConnect).not.toHaveBeenCalled();
});

test('createConnectPublic connects to a public IP literal', async () => {
  const connectPublic = createConnectPublic({ createNotPublicError });
  expect(await run(connectPublic, '1.1.1.1')).toEqual([null, 'socket']);
  expect(mockConnect.mock.calls[0][0]).toEqual({ hostname: '1.1.1.1' });
});

test('createConnectPublic leaves a host name to the connector lookup', async () => {
  const connectPublic = createConnectPublic({ createNotPublicError });
  expect(await run(connectPublic, 'files.test')).toEqual([null, 'socket']);
  expect(mockConnect.mock.calls[0][0]).toEqual({ hostname: 'files.test' });
});
