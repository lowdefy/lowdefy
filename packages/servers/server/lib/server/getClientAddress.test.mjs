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

import { Hono } from 'hono';
import { jest } from '@jest/globals';

const mockConfig = {};
jest.unstable_mockModule('../build/config.js', () => ({ default: mockConfig }));

// The resolver is built from config at module load, so each case loads a fresh
// module instance (the query string) against its own trustedProxies.
let loadCount = 0;
async function loadGetClientAddress({ trustedProxies }) {
  mockConfig.trustedProxies = trustedProxies;
  loadCount += 1;
  const { default: getClientAddress } = await import(`./getClientAddress.js?case=${loadCount}`);
  return getClientAddress;
}

// Runs one request through a Hono app the way @hono/node-server does, with the
// Node request (and its socket) as c.env.incoming.
async function resolve({ getClientAddress, clientAddressHeader, headers, peerAddress, logger }) {
  const app = new Hono();
  app.get('/', (c) =>
    c.json({ clientAddress: getClientAddress({ c, clientAddressHeader, logger }) })
  );
  const env = { incoming: { socket: { remoteAddress: peerAddress } } };
  const response = await app.request('/', { headers }, env);
  return (await response.json()).clientAddress;
}

function createLogger() {
  return { warn: jest.fn() };
}

test('getClientAddress takes the connection peer and ignores X-Forwarded-For without trusted proxies', async () => {
  const getClientAddress = await loadGetClientAddress({ trustedProxies: undefined });
  const clientAddress = await resolve({
    getClientAddress,
    headers: { 'x-forwarded-for': '203.0.113.9' },
    peerAddress: '198.51.100.4',
    logger: createLogger(),
  });
  expect(clientAddress).toBe('198.51.100.4');
});

test('getClientAddress reads X-Forwarded-For behind a trusted proxy', async () => {
  const getClientAddress = await loadGetClientAddress({ trustedProxies: ['10.0.0.0/8'] });
  const clientAddress = await resolve({
    getClientAddress,
    headers: { 'x-forwarded-for': '198.51.100.66, 203.0.113.9' },
    peerAddress: '10.0.0.2',
    logger: createLogger(),
  });
  expect(clientAddress).toBe('203.0.113.9');
});

test('getClientAddress takes the platform header when the entry names one', async () => {
  const getClientAddress = await loadGetClientAddress({ trustedProxies: undefined });
  const clientAddress = await resolve({
    getClientAddress,
    clientAddressHeader: 'x-real-ip',
    headers: { 'x-real-ip': '203.0.113.9', 'x-forwarded-for': '198.51.100.66' },
    peerAddress: '10.0.0.2',
    logger: createLogger(),
  });
  expect(clientAddress).toBe('203.0.113.9');
});

test('getClientAddress warns once when X-Forwarded-For arrives and trustedProxies is not set', async () => {
  const getClientAddress = await loadGetClientAddress({ trustedProxies: undefined });
  const logger = createLogger();
  const request = {
    getClientAddress,
    headers: { 'x-forwarded-for': '203.0.113.9' },
    peerAddress: '10.0.0.2',
    logger,
  };
  await resolve(request);
  await resolve(request);
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('config.trustedProxies'));
});

test('getClientAddress does not warn when trustedProxies is set', async () => {
  const getClientAddress = await loadGetClientAddress({ trustedProxies: [] });
  const logger = createLogger();
  await resolve({
    getClientAddress,
    headers: { 'x-forwarded-for': '203.0.113.9' },
    peerAddress: '10.0.0.2',
    logger,
  });
  expect(logger.warn).not.toHaveBeenCalled();
});
