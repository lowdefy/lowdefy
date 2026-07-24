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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveImage } from './resolveImage.js';

// A 1x1 transparent PNG.
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==',
  'base64'
);
const PNG_DATA_URL = `data:image/png;base64,${PNG_BYTES.toString('base64')}`;

// Collect logger warnings so a test can assert a failure was reported.
function makeLogger() {
  const calls = [];
  return { calls, warn: (...args) => calls.push(args) };
}

let publicDir;
let realFetch;

beforeAll(() => {
  publicDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ld-report-public-'));
  fs.writeFileSync(path.join(publicDir, 'logo.png'), PNG_BYTES);
  fs.mkdirSync(path.join(publicDir, 'assets'));
  fs.writeFileSync(path.join(publicDir, 'assets', 'nested.png'), PNG_BYTES);
  // A secret one directory above the public root, the target of a traversal.
  fs.writeFileSync(path.join(publicDir, '..', 'ld-report-secret.txt'), 'top secret');
  realFetch = globalThis.fetch;
});

afterAll(() => {
  fs.rmSync(publicDir, { recursive: true, force: true });
  fs.rmSync(path.join(publicDir, '..', 'ld-report-secret.txt'), { force: true });
  globalThis.fetch = realFetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
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

// --- public assets -----------------------------------------------------------

describe('public assets', () => {
  test('reads a relative path from the public directory', async () => {
    const result = await resolveImage({ src: 'logo.png', publicDir });
    expect(result.mime).toBe('image/png');
    expect(result.buffer.equals(PNG_BYTES)).toBe(true);
  });

  test('treats a leading-slash path as relative to the public root', async () => {
    const result = await resolveImage({ src: '/assets/nested.png', publicDir });
    expect(result.mime).toBe('image/png');
  });

  test('refuses a ../ traversal outside the public root and warns', async () => {
    const logger = makeLogger();
    const result = await resolveImage({ src: '../ld-report-secret.txt', publicDir, logger });
    expect(result).toBeNull();
    expect(logger.calls).toHaveLength(1);
    expect(logger.calls[0][1]).toMatch(/escapes/i);
  });

  test('refuses a missing file and warns', async () => {
    const logger = makeLogger();
    expect(await resolveImage({ src: 'nope.png', publicDir, logger })).toBeNull();
    expect(logger.calls[0][1]).toMatch(/could not be read/i);
  });

  test('refuses a non-image extension', async () => {
    const logger = makeLogger();
    expect(await resolveImage({ src: 'data.json', publicDir, logger })).toBeNull();
    expect(logger.calls[0][1]).toMatch(/not a supported image/i);
  });

  test('refuses a relative path when no public directory is configured', async () => {
    const logger = makeLogger();
    expect(await resolveImage({ src: 'logo.png', logger })).toBeNull();
    expect(logger.calls[0][1]).toMatch(/no public assets directory/i);
  });
});

// --- remote fetch guardrails -------------------------------------------------

describe('remote fetch', () => {
  test('refuses a private/loopback IP literal without connecting', async () => {
    const logger = makeLogger();
    let called = false;
    globalThis.fetch = () => {
      called = true;
      throw new Error('should not connect');
    };
    for (const host of ['10.0.0.5', '127.0.0.1', '169.254.1.1', '192.168.1.1', '172.16.0.1']) {
      const result = await resolveImage({ src: `http://${host}/logo.png`, logger });
      expect(result).toBeNull();
    }
    expect(called).toBe(false);
    expect(logger.calls.every((c) => /private, loopback, or link-local/i.test(c[1]))).toBe(true);
  });

  test('refuses an IPv6 loopback literal without connecting', async () => {
    let called = false;
    globalThis.fetch = () => {
      called = true;
      throw new Error('should not connect');
    };
    expect(await resolveImage({ src: 'http://[::1]/logo.png' })).toBeNull();
    expect(called).toBe(false);
  });

  test('fetches a public image and caps nothing under the limit', async () => {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'image/png']]),
      body: (async function* () {
        yield PNG_BYTES;
      })(),
    });
    const result = await resolveImage({ src: 'http://93.184.216.34/logo.png' });
    expect(result.mime).toBe('image/png');
    expect(result.buffer.equals(PNG_BYTES)).toBe(true);
  });

  test('aborts and refuses a body that exceeds the 5 MB cap', async () => {
    const logger = makeLogger();
    const chunk = Buffer.alloc(1024 * 1024); // 1 MB
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'image/png']]),
      body: (async function* () {
        for (let i = 0; i < 10; i += 1) yield chunk; // 10 MB total
      })(),
    });
    const result = await resolveImage({ src: 'http://93.184.216.34/big.png', logger });
    expect(result).toBeNull();
    expect(logger.calls[0][1]).toMatch(/cap/i);
  });

  test('refuses a declared content-length over the cap without reading the body', async () => {
    let bodyRead = false;
    globalThis.fetch = async () => ({
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
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'text/html; charset=utf-8']]),
      body: (async function* () {})(),
    });
    const result = await resolveImage({ src: 'http://93.184.216.34/page.html', logger });
    expect(result).toBeNull();
    expect(logger.calls[0][1]).toMatch(/not an image/i);
  });

  test('refuses a non-OK response', async () => {
    const logger = makeLogger();
    globalThis.fetch = async () => ({
      ok: false,
      status: 404,
      headers: new Map(),
      body: (async function* () {})(),
    });
    expect(await resolveImage({ src: 'http://93.184.216.34/missing.png', logger })).toBeNull();
    expect(logger.calls[0][1]).toMatch(/HTTP 404/);
  });

  test('refuses when the fetch throws', async () => {
    const logger = makeLogger();
    globalThis.fetch = async () => {
      throw new Error('network down');
    };
    expect(await resolveImage({ src: 'http://93.184.216.34/logo.png', logger })).toBeNull();
    expect(logger.calls[0][1]).toMatch(/fetch failed/i);
  });

  test('redacts the query string in the logged source', async () => {
    const logger = makeLogger();
    globalThis.fetch = async () => {
      throw new Error('network down');
    };
    await resolveImage({ src: 'http://93.184.216.34/logo.png?token=secret', logger });
    const logged = JSON.stringify(logger.calls[0]);
    expect(logged).not.toMatch(/token=secret/);
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
