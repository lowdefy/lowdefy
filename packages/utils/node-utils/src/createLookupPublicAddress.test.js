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

const mockLookup = jest.fn();

jest.unstable_mockModule('node:dns', () => ({
  lookup: (...lookupArgs) => mockLookup(...lookupArgs),
}));

const { default: createLookupPublicAddress } = await import('./createLookupPublicAddress.js');

function createNotPublicError(hostname) {
  const error = new Error(`Link to ${hostname} leads to an address that is not public.`);
  error.code = 'url_not_public';
  return error;
}

const lookupPublicAddress = createLookupPublicAddress({ createNotPublicError });

function answer(...result) {
  mockLookup.mockImplementation((hostname, options, callback) => callback(...result));
}

function run(options) {
  return new Promise((resolve) => {
    lookupPublicAddress('files.test', options, (...result) => resolve(result));
  });
}

test('createLookupPublicAddress hands the socket the public addresses it resolved', async () => {
  const addresses = [
    { address: '2606:4700:4700::1111', family: 6 },
    { address: '1.1.1.1', family: 4 },
  ];
  answer(null, addresses);
  const [error, address] = await run({ all: true });
  expect(error).toBe(null);
  expect(address).toBe(addresses);
  expect(mockLookup.mock.calls[0][0]).toBe('files.test');
  expect(mockLookup.mock.calls[0][1]).toEqual({ all: true });
});

test('createLookupPublicAddress hands the socket a single public address with its family', async () => {
  answer(null, '1.1.1.1', 4);
  expect(await run({})).toEqual([null, '1.1.1.1', 4]);
});

test('createLookupPublicAddress refuses a name when any address it resolves to is not public', async () => {
  answer(null, [
    { address: '1.1.1.1', family: 4 },
    { address: '10.0.0.1', family: 4 },
  ]);
  const [error, address] = await run({ all: true });
  expect(error.code).toBe('url_not_public');
  expect(error.message).toBe('Link to files.test leads to an address that is not public.');
  expect(address).toBeUndefined();
});

test('createLookupPublicAddress refuses a single address that is not public', async () => {
  answer(null, '169.254.169.254', 4);
  const [error] = await run({});
  expect(error.code).toBe('url_not_public');
});

test('createLookupPublicAddress checks every lookup, so a name that rebinds to a private address is refused', async () => {
  answer(null, '1.1.1.1', 4);
  expect((await run({}))[0]).toBe(null);
  answer(null, '127.0.0.1', 4);
  expect((await run({}))[0].code).toBe('url_not_public');
});

test('createLookupPublicAddress passes a DNS error through', async () => {
  const dnsError = Object.assign(new Error('getaddrinfo ENOTFOUND files.test'), {
    code: 'ENOTFOUND',
  });
  answer(dnsError);
  expect(await run({})).toEqual([dnsError]);
});
