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

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { jest } from '@jest/globals';

// The resolver fetches through undici (not the global fetch) so it can pin the
// connection to the addresses it checked. Mock the module: `fetch` records its
// calls and `Agent` records the connect options it was built with.
const fetchMock = jest.fn();
const agents = [];
class MockAgent {
  constructor(options) {
    this.options = options;
    this.closed = false;
    agents.push(this);
  }
  async close() {
    this.closed = true;
  }
}
jest.unstable_mockModule('undici', () => ({ fetch: fetchMock, Agent: MockAgent }));

const dnsLookup = jest.fn();
jest.unstable_mockModule('node:dns/promises', () => ({ default: { lookup: dnsLookup } }));

const { resolveImage } = await import('./resolveImage.js');

// A 1x1 transparent PNG.
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==',
  'base64'
);
const PNG_DATA_URL = `data:image/png;base64,${PNG_BYTES.toString('base64')}`;

function makeLogger() {
  const calls = [];
  return { calls, warn: (...args) => calls.push(args) };
}

function pngResponse(bytes = PNG_BYTES, headers = {}) {
  return {
    ok: true,
    status: 200,
    headers: new Map([['content-type', 'image/png'], ...Object.entries(headers)]),
    body: (async function* () {
      yield bytes;
    })(),
  };
}

function reachedUrl() {
  return String(fetchMock.mock.calls[0][0]);
}

// A public directory on disk, with a sibling file outside it that a traversal
// would reach.
let root;
let publicDirectory;
beforeAll(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-reports-images-'));
  publicDirectory = path.join(root, 'public');
  await fs.mkdir(path.join(publicDirectory, 'assets'), { recursive: true });
  await fs.writeFile(path.join(publicDirectory, 'logo.png'), PNG_BYTES);
  await fs.writeFile(path.join(publicDirectory, 'assets', 'nested.png'), PNG_BYTES);
  await fs.writeFile(path.join(publicDirectory, 'index.html'), '<html></html>');
  await fs.writeFile(path.join(root, 'secret.png'), PNG_BYTES);
});

afterAll(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

beforeEach(() => {
  agents.length = 0;
  fetchMock.mockReset();
  dnsLookup.mockReset();
  dnsLookup.mockRejectedValue(new Error('no DNS in tests'));
});

// --- data URIs ---------------------------------------------------------------

describe('data URIs', () => {
  test('round-trips a base64 image data URI to bytes and mime', async () => {
    const result = await resolveImage({ src: PNG_DATA_URL });
    expect(result.mime).toBe('image/png');
    expect(result.buffer.equals(PNG_BYTES)).toBe(true);
  });

  test('decodes a URL-encoded (non-base64) svg data URI', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
    const result = await resolveImage({ src: `data:image/svg+xml,${encodeURIComponent(svg)}` });
    expect(result.mime).toBe('image/svg+xml');
    expect(result.buffer.toString('utf8')).toBe(svg);
  });

  test('refuses a non-image data URI and warns', async () => {
    const logger = makeLogger();
    const result = await resolveImage({ src: 'data:text/plain;base64,aGVsbG8=', logger });
    expect(result).toBeNull();
    expect(logger.calls).toHaveLength(1);
    expect(logger.calls[0][1]).toMatch(/not an image/i);
  });

  test('refuses a malformed data URI', async () => {
    const logger = makeLogger();
    expect(await resolveImage({ src: 'data:image/png;base64', logger })).toBeNull();
    expect(logger.calls).toHaveLength(1);
  });
});

// --- relative paths: public directory first ----------------------------------

describe('relative paths', () => {
  test('reads a leading-slash path from the public directory without fetching', async () => {
    const result = await resolveImage({ src: '/logo.png', publicDirectory });
    expect(result.mime).toBe('image/png');
    expect(result.buffer.equals(PNG_BYTES)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('reads a bare nested path from the public directory', async () => {
    const result = await resolveImage({
      src: 'assets/nested.png?v=2',
      publicDirectory,
      origin: 'https://app.example.com',
    });
    expect(result.mime).toBe('image/png');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('refuses a path that escapes the public directory and does not fetch it', async () => {
    const logger = makeLogger();
    for (const src of ['/../secret.png', '../secret.png', '/assets/../../secret.png']) {
      const result = await resolveImage({
        src,
        publicDirectory,
        origin: 'https://app.example.com',
        logger,
      });
      expect(result).toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logger.calls.every((call) => /escapes the public directory/i.test(call[1]))).toBe(true);
  });

  test('refuses a percent-encoded traversal', async () => {
    const logger = makeLogger();
    const result = await resolveImage({ src: '/%2e%2e/secret.png', publicDirectory, logger });
    expect(result).toBeNull();
    expect(logger.calls[0][1]).toMatch(/escapes the public directory/i);
  });

  test('refuses a public file that is not an image, without fetching', async () => {
    const logger = makeLogger();
    const result = await resolveImage({
      src: '/index.html',
      publicDirectory,
      origin: 'https://app.example.com',
      logger,
    });
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logger.calls[0][1]).toMatch(/does not name an image/i);
  });

  test('falls back to a guarded fetch from origin when the file is not on disk', async () => {
    dnsLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    fetchMock.mockResolvedValue(pngResponse());
    const result = await resolveImage({
      src: '/missing.png',
      publicDirectory,
      origin: 'https://app.example.com',
    });
    expect(result.mime).toBe('image/png');
    expect(reachedUrl()).toBe('https://app.example.com/missing.png');
  });

  test('fetches from origin when no public directory is configured', async () => {
    dnsLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    fetchMock.mockResolvedValue(pngResponse());
    const result = await resolveImage({ src: 'logo.png', origin: 'https://app.example.com' });
    expect(result.mime).toBe('image/png');
    expect(reachedUrl()).toBe('https://app.example.com/logo.png');
  });

  // The origin is derived from the request's Host header, which the client
  // controls, so it gets no exemption from the private-address guard.
  test('refuses the origin fallback when origin is a private or loopback address', async () => {
    const logger = makeLogger();
    const result = await resolveImage({
      src: '/missing.png',
      publicDirectory,
      origin: 'http://127.0.0.1:3000',
      logger,
    });
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logger.calls[0][1]).toMatch(/private, loopback, or link-local/i);
  });

  test('refuses a relative path with neither a public directory nor an origin', async () => {
    const logger = makeLogger();
    expect(await resolveImage({ src: 'logo.png', logger })).toBeNull();
    expect(logger.calls[0][1]).toMatch(/no origin/i);
  });
});

// --- remote fetch guardrails -------------------------------------------------

describe('remote fetch', () => {
  test('refuses private, loopback, link-local, CGNAT, multicast and reserved IPv4 literals without connecting', async () => {
    const logger = makeLogger();
    const hosts = [
      '10.0.0.5',
      '127.0.0.1',
      '169.254.1.1',
      '192.168.1.1',
      '172.16.0.1',
      '100.64.0.1', // carrier-grade NAT
      '100.127.255.254',
      '224.0.0.1', // multicast
      '240.0.0.1', // reserved
      '255.255.255.255', // broadcast
      '0.0.0.0',
    ];
    for (const host of hosts) {
      expect(await resolveImage({ src: `http://${host}/logo.png`, logger })).toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logger.calls.every((c) => /private, loopback, or link-local/i.test(c[1]))).toBe(true);
  });

  test('still fetches the public neighbours of the refused IPv4 ranges', async () => {
    fetchMock.mockResolvedValue(pngResponse());
    for (const host of ['100.63.255.255', '100.128.0.1', '223.255.255.255', '11.0.0.1']) {
      fetchMock.mockClear();
      const result = await resolveImage({ src: `http://${host}/logo.png` });
      expect(result?.mime).toBe('image/png');
    }
  });

  test('refuses an IPv6 loopback literal without connecting', async () => {
    expect(await resolveImage({ src: 'http://[::1]/logo.png' })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Every spelling of a refused address, because URL picks the spelling: it
  // rewrites [::ffff:127.0.0.1] to [::ffff:7f00:1].
  test('refuses every spelling of a private IPv6 address without connecting', async () => {
    const hosts = [
      '::ffff:127.0.0.1',
      '::ffff:7f00:1',
      '::ffff:169.254.169.254',
      '::ffff:a9fe:a9fe',
      '::ffff:100.64.0.1', // mapped CGNAT
      '::0:1',
      '0:0:0:0:0:0:0:1',
      'fe80::1',
      'fe80::5054:ff:fe12:3456',
      'febf::1',
      'fd00::1',
      'fc00::1',
      '64:ff9b::7f00:1',
      'ff02::1', // multicast
      'ff05::2',
      '::',
    ];
    for (const host of hosts) {
      expect(await resolveImage({ src: `http://[${host}]/logo.png` })).toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('a public IPv6 literal still fetches', async () => {
    fetchMock.mockResolvedValue(pngResponse());
    const result = await resolveImage({ src: 'http://[2606:4700:4700::1111]/logo.png' });
    expect(result?.mime).toBe('image/png');
    expect(reachedUrl()).toBe('http://[2606:4700:4700::1111]/logo.png');
  });

  test('pins the connection to the checked address and closes the agent afterwards', async () => {
    fetchMock.mockResolvedValue(pngResponse());
    await resolveImage({ src: 'http://93.184.216.34/logo.png' });
    const options = fetchMock.mock.calls[0][1];
    expect(options.redirect).toBe('error');
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(agents).toHaveLength(1);
    expect(options.dispatcher).toBe(agents[0]);
    expect(agents[0].closed).toBe(true);

    const lookup = agents[0].options.connect.lookup;
    const single = await new Promise((resolve) =>
      lookup('93.184.216.34', {}, (error, address, family) => resolve({ error, address, family }))
    );
    expect(single).toEqual({ error: null, address: '93.184.216.34', family: 4 });
    const all = await new Promise((resolve) =>
      lookup('93.184.216.34', { all: true }, (error, records) => resolve({ error, records }))
    );
    expect(all).toEqual({ error: null, records: [{ address: '93.184.216.34', family: 4 }] });
  });

  test('resolves a hostname once and pins the connection to those addresses', async () => {
    dnsLookup.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
    ]);
    fetchMock.mockResolvedValue(pngResponse());
    const result = await resolveImage({ src: 'https://example.com/logo.png' });
    expect(result?.mime).toBe('image/png');
    expect(dnsLookup).toHaveBeenCalledTimes(1);
    expect(dnsLookup).toHaveBeenCalledWith('example.com', { all: true });
    const lookup = agents[0].options.connect.lookup;
    const all = await new Promise((resolve) =>
      lookup('example.com', { all: true }, (error, records) => resolve(records))
    );
    expect(all).toEqual([
      { address: '93.184.216.34', family: 4 },
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
    ]);
  });

  test('refuses a hostname when any resolved address is private', async () => {
    const logger = makeLogger();
    dnsLookup.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.5', family: 4 },
    ]);
    expect(await resolveImage({ src: 'https://rebind.example/logo.png', logger })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logger.calls[0][1]).toMatch(/private, loopback, or link-local/i);
  });

  test('refuses a hostname that does not resolve', async () => {
    expect(await resolveImage({ src: 'https://nowhere.invalid/logo.png' })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('fetches a public image and caps nothing under the limit', async () => {
    fetchMock.mockResolvedValue(pngResponse());
    const result = await resolveImage({ src: 'http://93.184.216.34/logo.png' });
    expect(result.mime).toBe('image/png');
    expect(result.buffer.equals(PNG_BYTES)).toBe(true);
  });

  test('aborts and refuses a body that exceeds the 5 MB cap', async () => {
    const logger = makeLogger();
    const chunk = Buffer.alloc(1024 * 1024);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'image/png']]),
      body: (async function* () {
        for (let i = 0; i < 10; i += 1) yield chunk;
      })(),
    });
    expect(await resolveImage({ src: 'http://93.184.216.34/big.png', logger })).toBeNull();
    expect(logger.calls[0][1]).toMatch(/cap/i);
  });

  test('refuses a declared content-length over the cap without reading the body', async () => {
    let bodyRead = false;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([
        ['content-type', 'image/png'],
        ['content-length', String(6 * 1024 * 1024)],
      ]),
      body: (async function* () {
        bodyRead = true;
        yield PNG_BYTES;
      })(),
    });
    expect(await resolveImage({ src: 'http://93.184.216.34/big.png' })).toBeNull();
    expect(bodyRead).toBe(false);
  });

  test('refuses a non-image content-type and warns', async () => {
    const logger = makeLogger();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'text/html; charset=utf-8']]),
      body: (async function* () {})(),
    });
    expect(await resolveImage({ src: 'http://93.184.216.34/page.html', logger })).toBeNull();
    expect(logger.calls[0][1]).toMatch(/not an image/i);
  });

  test('refuses a non-OK response', async () => {
    const logger = makeLogger();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Map(),
      body: (async function* () {})(),
    });
    expect(await resolveImage({ src: 'http://93.184.216.34/missing.png', logger })).toBeNull();
    expect(logger.calls[0][1]).toMatch(/HTTP 404/);
  });

  test('refuses when the fetch throws and still closes the agent', async () => {
    const logger = makeLogger();
    fetchMock.mockRejectedValue(new Error('network down'));
    expect(await resolveImage({ src: 'http://93.184.216.34/logo.png', logger })).toBeNull();
    expect(logger.calls[0][1]).toMatch(/fetch failed/i);
    expect(agents[0].closed).toBe(true);
  });

  test('redacts the query string in the logged source', async () => {
    const logger = makeLogger();
    fetchMock.mockRejectedValue(new Error('network down'));
    await resolveImage({ src: 'http://93.184.216.34/logo.png?token=secret', logger });
    expect(JSON.stringify(logger.calls[0])).not.toMatch(/token=secret/);
  });

  test('refuses an absolute URL to a private address even when it equals origin', async () => {
    const logger = makeLogger();
    const result = await resolveImage({
      src: 'http://127.0.0.1:3000/logo.png',
      origin: 'http://127.0.0.1:3000',
      publicDirectory,
      logger,
    });
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logger.calls[0][1]).toMatch(/private, loopback, or link-local/i);
  });
});

// --- empty / invalid sources -------------------------------------------------

describe('invalid sources', () => {
  test('refuses an empty or non-string src and warns', async () => {
    const logger = makeLogger();
    expect(await resolveImage({ src: '', logger })).toBeNull();
    expect(await resolveImage({ src: undefined, logger })).toBeNull();
    expect(await resolveImage({})).toBeNull();
    expect(logger.calls.every((c) => /empty/i.test(c[1]))).toBe(true);
  });
});
