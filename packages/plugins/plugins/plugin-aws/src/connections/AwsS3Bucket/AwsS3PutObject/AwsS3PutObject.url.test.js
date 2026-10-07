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

import { Readable } from 'node:stream';
import { jest } from '@jest/globals';

const mockSend = jest.fn();
const mockPutObjectCommand = jest.fn();
const mockFetchUrl = jest.fn();
const mockConnect = jest.fn();
const undici = jest.requireActual('undici');

// fetch is mocked per test; a test that needs the real connection path hands it undici's fetch.
// mockConnect records each socket the url copy's connector opens.
jest.unstable_mockModule('undici', () => ({
  ...undici,
  buildConnector: (options) => {
    const connect = undici.buildConnector(options);
    return (...connectArgs) => {
      mockConnect(...connectArgs);
      return connect(...connectArgs);
    };
  },
  fetch: (...fetchArgs) => mockFetchUrl(...fetchArgs),
}));

jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: (...sendArgs) => mockSend(...sendArgs),
  })),
  PutObjectCommand: jest.fn().mockImplementation((params) => {
    mockPutObjectCommand(params);
    return params;
  }),
}));

const { default: AwsS3PutObject } = await import('./AwsS3PutObject.js');

const connection = {
  accessKeyId: 'accessKeyId',
  secretAccessKey: 'secretAccessKey',
  region: 'region',
  bucket: 'bucket',
  write: true,
};

const url = 'https://client.test/screenshot.png?X-Amz-Signature=abc';
let stored;

// Reads the body the way the S3 client would, so a refusal raised mid-stream reaches send.
async function readBody(body) {
  if (Buffer.isBuffer(body)) return body;
  const chunks = [];
  for await (const chunk of body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function bodyOf(chunks) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}

function mockFetch({ chunks = ['hello'], status = 200, headers = {}, length = 'auto' } = {}) {
  const allHeaders = { 'content-type': 'image/png', ...headers };
  if (length === 'auto') {
    allHeaders['content-length'] = String(Buffer.byteLength(chunks.join('')));
  } else if (length !== null) {
    allHeaders['content-length'] = String(length);
  }
  mockFetchUrl.mockImplementation(
    async () => new Response(bodyOf(chunks), { status, headers: allHeaders })
  );
}

async function refusal(request) {
  try {
    await AwsS3PutObject({ request: { key: 'copies/shot.png', url, ...request }, connection });
  } catch (error) {
    return error;
  }
  throw new Error('Expected AwsS3PutObject to refuse the copy.');
}

beforeEach(() => {
  mockFetchUrl.mockReset();
  mockConnect.mockReset();
  mockSend.mockReset();
  mockPutObjectCommand.mockReset();
  stored = null;
  mockSend.mockImplementation(async (params) => {
    stored = await readBody(params.Body);
    return {};
  });
});

test('AwsS3PutObject copies a url into the bucket and returns its size and content type', async () => {
  mockFetch({ chunks: ['hel', 'lo'] });
  const res = await AwsS3PutObject({
    request: { key: 'copies/shot.png', url, maxBytes: 100, contentTypes: ['image/*'] },
    connection,
  });
  expect(res).toEqual({
    bucket: 'bucket',
    key: 'copies/shot.png',
    size: 5,
    contentType: 'image/png',
  });
  expect(mockFetchUrl.mock.calls[0][0]).toBe(url);
  const params = mockPutObjectCommand.mock.calls[0][0];
  expect(params.Bucket).toBe('bucket');
  expect(params.Key).toBe('copies/shot.png');
  expect(params.ContentLength).toBe(5);
  expect(params.ContentType).toBe('image/png');
  expect(params.Body).toBeInstanceOf(Readable);
  expect(mockSend.mock.calls[0][1].abortSignal).toBeInstanceOf(AbortSignal);
  expect(stored.toString()).toBe('hello');
});

test('AwsS3PutObject stores the given contentType over the one the url answers with', async () => {
  mockFetch({ headers: { 'content-type': 'application/octet-stream' } });
  const res = await AwsS3PutObject({
    request: { key: 'k', url, maxBytes: 100, contentType: 'image/png', acl: 'private' },
    connection,
  });
  expect(res.contentType).toBe('image/png');
  const params = mockPutObjectCommand.mock.calls[0][0];
  expect(params.ContentType).toBe('image/png');
  expect(params.ACL).toBe('private');
});

test('AwsS3PutObject copies a url answer exactly at maxBytes', async () => {
  mockFetch({ chunks: ['12345', '67890'] });
  const res = await AwsS3PutObject({ request: { key: 'k', url, maxBytes: 10 }, connection });
  expect(res.size).toBe(10);
  expect(stored.toString()).toBe('1234567890');
});

test('AwsS3PutObject copies a url answer with no Content-Length exactly at maxBytes', async () => {
  mockFetch({ chunks: ['12345', '67890'], length: null });
  const res = await AwsS3PutObject({ request: { key: 'k', url, maxBytes: 10 }, connection });
  expect(res.size).toBe(10);
  const params = mockPutObjectCommand.mock.calls[0][0];
  expect(Buffer.isBuffer(params.Body)).toBe(true);
  expect(params.ContentLength).toBeUndefined();
  expect(stored.toString()).toBe('1234567890');
});

test.each([
  ['http://client.test/shot.png'],
  ['ftp://client.test/shot.png'],
  ['file:///etc/passwd'],
  ['not a url'],
])('AwsS3PutObject refuses %s with url_not_https before a request is made', async (link) => {
  const error = await refusal({ url: link, maxBytes: 10 });
  expect(error.code).toBe('url_not_https');
  expect(error.message).toBe('AwsS3PutObject "url" must be an https: link.');
  expect(mockFetchUrl).not.toHaveBeenCalled();
  expect(mockSend).not.toHaveBeenCalled();
});

test('AwsS3PutObject asks for the body uncompressed and follows no redirect on its own', async () => {
  mockFetch();
  await AwsS3PutObject({ request: { key: 'k', url, maxBytes: 100 }, connection });
  const options = mockFetchUrl.mock.calls[0][1];
  expect(options.headers).toEqual({ 'accept-encoding': 'identity' });
  expect(options.redirect).toBe('manual');
  expect(options.dispatcher).toBeInstanceOf(undici.Agent);
});

test('AwsS3PutObject follows a redirect to an https link', async () => {
  mockFetchUrl.mockImplementation(async (link) => {
    if (link === url) {
      return new Response(null, { status: 302, headers: { location: '/moved/shot.png' } });
    }
    return new Response(bodyOf(['hello']), {
      status: 200,
      headers: { 'content-type': 'image/png', 'content-length': '5' },
    });
  });
  const res = await AwsS3PutObject({ request: { key: 'k', url, maxBytes: 100 }, connection });
  expect(mockFetchUrl.mock.calls.map(([link]) => link)).toEqual([
    url,
    'https://client.test/moved/shot.png',
  ]);
  expect(res.size).toBe(5);
  expect(stored.toString()).toBe('hello');
});

test.each([['http://169.254.169.254/latest/meta-data/'], ['file:///etc/passwd']])(
  'AwsS3PutObject refuses a redirect to %s before requesting it',
  async (location) => {
    mockFetchUrl.mockImplementation(
      async () => new Response(null, { status: 301, headers: { location } })
    );
    const error = await refusal({ maxBytes: 100 });
    expect(error.code).toBe('url_not_https');
    expect(error.message).toBe('AwsS3PutObject "url" redirected to a link that is not https:.');
    expect(mockFetchUrl).toHaveBeenCalledTimes(1);
    expect(mockSend).not.toHaveBeenCalled();
  }
);

const notPublicMessage = 'AwsS3PutObject "url" leads to an address that is not public.';

test.each([
  ['https://127.0.0.1/shot.png'],
  ['https://10.0.0.1/shot.png'],
  ['https://169.254.169.254/latest/meta-data/'],
  ['https://[::1]/shot.png'],
  ['https://[::ffff:127.0.0.1]/shot.png'],
  ['https://[fd00::1]/shot.png'],
])('AwsS3PutObject refuses %s with url_not_public before connecting', async (link) => {
  mockFetchUrl.mockImplementation(undici.fetch);
  const error = await refusal({ url: link, maxBytes: 100, timeout: 2000 });
  expect(error.code).toBe('url_not_public');
  expect(error.message).toBe(notPublicMessage);
  expect(mockConnect).not.toHaveBeenCalled();
  expect(mockSend).not.toHaveBeenCalled();
});

test.each([
  ['https://127.0.0.1/shot.png'],
  ['https://10.0.0.1/shot.png'],
  ['https://169.254.169.254/latest/meta-data/'],
  ['https://[::1]/shot.png'],
])(
  'AwsS3PutObject refuses a redirect to %s with url_not_public before connecting',
  async (location) => {
    mockFetchUrl.mockImplementation(async (link, options) => {
      if (link === url) {
        return new Response(null, { status: 302, headers: { location } });
      }
      return undici.fetch(link, options);
    });
    const error = await refusal({ maxBytes: 100, timeout: 2000 });
    expect(error.code).toBe('url_not_public');
    expect(error.message).toBe(notPublicMessage);
    expect(mockFetchUrl.mock.calls.map(([link]) => link)).toEqual([url, location]);
    expect(mockConnect).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  }
);

test('AwsS3PutObject refuses a name that resolves to loopback with url_not_public', async () => {
  mockFetchUrl.mockImplementation(undici.fetch);
  const error = await refusal({ url: 'https://localhost/shot.png', maxBytes: 100, timeout: 2000 });
  expect(error.code).toBe('url_not_public');
  expect(error.message).toBe(notPublicMessage);
  expect(mockSend).not.toHaveBeenCalled();
});

test('AwsS3PutObject refuses a url that redirects more than 20 times', async () => {
  mockFetchUrl.mockImplementation(
    async () => new Response(null, { status: 307, headers: { location: url } })
  );
  const error = await refusal({ maxBytes: 100 });
  expect(error.code).toBe('fetch_failed');
  expect(error.message).toBe('AwsS3PutObject url redirected more than 20 times.');
  expect(mockFetchUrl).toHaveBeenCalledTimes(21);
  expect(mockSend).not.toHaveBeenCalled();
});

test('AwsS3PutObject refuses a Content-Length over maxBytes before reading the body', async () => {
  mockFetch({ chunks: ['12345678901'] });
  const error = await refusal({ maxBytes: 10 });
  expect(error.code).toBe('too_large');
  expect(error.message).toBe(
    'AwsS3PutObject url content of 11 bytes is larger than maxBytes (10).'
  );
  expect(mockSend).not.toHaveBeenCalled();
});

test('AwsS3PutObject refuses a body with no Content-Length once it passes maxBytes', async () => {
  mockFetch({ chunks: ['123456', '789012'], length: null });
  const error = await refusal({ maxBytes: 10 });
  expect(error.code).toBe('too_large');
  expect(error.message).toBe('AwsS3PutObject url content is larger than maxBytes (10).');
  expect(mockSend).not.toHaveBeenCalled();
});

test('AwsS3PutObject refuses a body longer than its Content-Length past maxBytes, storing nothing', async () => {
  mockFetch({ chunks: ['1234', '56789012345'], length: 4 });
  const error = await refusal({ maxBytes: 10 });
  expect(error.code).toBe('too_large');
  expect(stored).toBe(null);
});

test('AwsS3PutObject refuses a body longer than its Content-Length within maxBytes, storing nothing', async () => {
  mockFetch({ chunks: ['1234', '5678'], length: 4 });
  const error = await refusal({ maxBytes: 10 });
  expect(error.code).toBe('fetch_failed');
  expect(error.message).toBe(
    'AwsS3PutObject url sent more than the 4 bytes its Content-Length declared.'
  );
  expect(stored).toBe(null);
});

test('AwsS3PutObject refuses a body shorter than its Content-Length, storing nothing', async () => {
  mockFetch({ chunks: ['1234'], length: 8 });
  const error = await refusal({ maxBytes: 10 });
  expect(error.code).toBe('fetch_failed');
  expect(error.message).toBe(
    'AwsS3PutObject url sent 4 of the 8 bytes its Content-Length declared.'
  );
  expect(stored).toBe(null);
});

test('AwsS3PutObject reports the refusal when the S3 client wraps the failed body stream', async () => {
  mockFetch({ chunks: ['1234', '5678'], length: 4 });
  mockSend.mockImplementation(async (params) => {
    try {
      await readBody(params.Body);
    } catch {
      throw new Error('Socket closed.');
    }
  });
  const error = await refusal({ maxBytes: 10 });
  expect(error.code).toBe('fetch_failed');
});

test.each([
  [['image/png'], 'image/jpeg', false],
  [['image/png', 'application/pdf'], 'application/pdf', true],
  [['image/*'], 'image/webp; charset=binary', true],
  [['IMAGE/PNG'], 'image/png', true],
  [['*/*'], 'text/html', true],
  [['image/*'], 'imagex/png', false],
])(
  'AwsS3PutObject with contentTypes %j and an answer of %s copies: %s',
  async (contentTypes, responseType, copies) => {
    mockFetch({ headers: { 'content-type': responseType } });
    const request = { key: 'k', url, maxBytes: 100, contentTypes };
    if (copies) {
      const res = await AwsS3PutObject({ request, connection });
      expect(res.contentType).toBe(responseType);
    } else {
      const error = await refusal(request);
      expect(error.code).toBe('content_type');
      expect(mockSend).not.toHaveBeenCalled();
    }
  }
);

test('AwsS3PutObject refuses an answer with no Content-Type when contentTypes is given', async () => {
  mockFetchUrl.mockImplementation(async () => {
    const response = new Response(bodyOf(['x']), { headers: { 'content-length': '1' } });
    response.headers.delete('content-type');
    return response;
  });
  const error = await refusal({ maxBytes: 10, contentTypes: ['image/png'] });
  expect(error.code).toBe('content_type');
  expect(error.message).toBe('AwsS3PutObject url content type null is not one of image/png.');
});

test('AwsS3PutObject refuses a non-2xx answer with fetch_failed and its status', async () => {
  mockFetch({ status: 403, chunks: ['<Error>AccessDenied</Error>'] });
  const error = await refusal({ maxBytes: 100 });
  expect(error.code).toBe('fetch_failed');
  expect(error.status).toBe(403);
  expect(error.message).toBe('AwsS3PutObject url answered 403.');
  expect(mockSend).not.toHaveBeenCalled();
});

test('AwsS3PutObject refuses a network error with fetch_failed, leaving the url out', async () => {
  mockFetchUrl.mockImplementation(async () => {
    throw new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });
  });
  const error = await refusal({ maxBytes: 100 });
  expect(error.code).toBe('fetch_failed');
  expect(error.status).toBeUndefined();
  expect(error.message).toBe('AwsS3PutObject could not fetch the url: fetch failed');
  expect(error.message).not.toContain('X-Amz-Signature');
});

test('AwsS3PutObject refuses a fetch that outlasts timeout with code timeout', async () => {
  mockFetchUrl.mockImplementation(
    (link, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason));
      })
  );
  const error = await refusal({ maxBytes: 100, timeout: 20 });
  expect(error.code).toBe('timeout');
  expect(error.message).toBe('AwsS3PutObject did not copy the url within the 20 ms timeout.');
  expect(mockSend).not.toHaveBeenCalled();
});

test('AwsS3PutObject refuses an upload that outlasts timeout with code timeout', async () => {
  mockFetch();
  mockSend.mockImplementation(
    (params, { abortSignal }) =>
      new Promise((resolve, reject) => {
        abortSignal.addEventListener('abort', () => reject(new Error('Request aborted')));
      })
  );
  const error = await refusal({ maxBytes: 100, timeout: 20 });
  expect(error.code).toBe('timeout');
});

test('AwsS3PutObject names url as a credential, so a refused copy keeps it out of received', () => {
  expect(AwsS3PutObject.meta.credentialProperties).toEqual(['url']);
});

test('AwsS3PutObject passes an S3 error through unchanged', async () => {
  mockFetch();
  mockSend.mockImplementation(async () => {
    throw new Error('Access Denied');
  });
  const error = await refusal({ maxBytes: 100 });
  expect(error.message).toBe('Access Denied');
  expect(error.code).toBeUndefined();
});
