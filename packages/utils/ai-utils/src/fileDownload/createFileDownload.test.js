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
import { MockLanguageModelV4 } from 'ai/test';

const mockFetchUrl = jest.fn();
const mockConnect = jest.fn();
const undici = jest.requireActual('undici');

// fetch is mocked per test; a test that needs the real connection path hands it undici's fetch.
// mockConnect records each socket the download's connector opens.
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

const { default: createFileDownload } = await import('./createFileDownload.js');
const { default: createToolLoopAgent } = await import('../createToolLoopAgent.js');

const url = 'https://files.test/report.csv?X-Amz-Signature=secret';

function bodyOf(chunks) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}

function mockFetch({ chunks = ['a,b\n1,2\n'], status = 200, headers = {}, length = 'auto' } = {}) {
  const allHeaders = { 'content-type': 'text/csv', ...headers };
  if (length === 'auto') {
    allHeaders['content-length'] = String(Buffer.byteLength(chunks.join('')));
  } else if (length !== null) {
    allHeaders['content-length'] = String(length);
  }
  mockFetchUrl.mockImplementation(
    async () => new Response(bodyOf(chunks), { status, headers: allHeaders })
  );
}

async function downloadOne(link = url, options = {}) {
  const download = createFileDownload(options);
  const [file] = await download([{ url: new URL(link), isUrlSupportedByModel: false }]);
  return file;
}

async function refusal(link = url, options = {}) {
  try {
    await downloadOne(link, options);
  } catch (error) {
    return error;
  }
  throw new Error('Expected the download to be refused.');
}

beforeEach(() => {
  mockFetchUrl.mockReset();
  mockConnect.mockReset();
});

test('createFileDownload reads a file the model does not take as a link', async () => {
  mockFetch({ chunks: ['a,b\n', '1,2\n'] });
  const file = await downloadOne();
  expect(file.mediaType).toBe('text/csv');
  expect(Buffer.from(file.data).toString()).toBe('a,b\n1,2\n');
  expect(file.data).toBeInstanceOf(Uint8Array);
  const [link, options] = mockFetchUrl.mock.calls[0];
  expect(link).toBe(url);
  expect(options.redirect).toBe('manual');
  expect(options.dispatcher).toBeInstanceOf(undici.Agent);
  expect(options.signal).toBeInstanceOf(AbortSignal);
});

test('createFileDownload leaves a link the model takes to the provider', async () => {
  const download = createFileDownload({});
  const files = await download([
    { url: new URL('https://files.test/shot.png'), isUrlSupportedByModel: true },
  ]);
  expect(files).toEqual([null]);
  expect(mockFetchUrl).not.toHaveBeenCalled();
});

test.each([['http://files.test/report.csv'], ['ftp://files.test/report.csv']])(
  'createFileDownload refuses %s before requesting it',
  async (link) => {
    const error = await refusal(link);
    expect(error.code).toBe('url_not_https');
    expect(error.message).toBe('File links the server downloads must be https: links.');
    expect(mockFetchUrl).not.toHaveBeenCalled();
  }
);

test('createFileDownload refuses a Content-Length over maxBytes before reading the body', async () => {
  mockFetch({ chunks: ['12345678901'] });
  const error = await refusal(url, { maxBytes: 10 });
  expect(error.code).toBe('too_large');
  expect(error.message).toBe(
    'File from files.test is larger than fileDownload.maxBytes (10 bytes).'
  );
});

test('createFileDownload refuses a body with no Content-Length once it passes maxBytes', async () => {
  const cancel = jest.fn();
  let sent = 0;
  mockFetchUrl.mockImplementation(
    async () =>
      new Response(
        new ReadableStream({
          pull(controller) {
            sent += 1;
            controller.enqueue(new TextEncoder().encode('123456'));
          },
          cancel,
        }),
        { status: 200, headers: { 'content-type': 'text/plain' } }
      )
  );
  const error = await refusal(url, { maxBytes: 10 });
  expect(error.code).toBe('too_large');
  expect(cancel).toHaveBeenCalled();
  expect(sent).toBeLessThan(5);
});

test('createFileDownload defaults maxBytes to 20 MB', async () => {
  mockFetch({ chunks: [''], length: 20 * 1024 * 1024 + 1 });
  expect((await refusal()).code).toBe('too_large');
  mockFetch({ chunks: ['ok'] });
  expect(Buffer.from((await downloadOne()).data).toString()).toBe('ok');
});

test('createFileDownload stops a download that passes its timeout', async () => {
  mockFetchUrl.mockImplementation(
    async (link, { signal }) =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('partial'));
            signal.addEventListener('abort', () => controller.error(signal.reason));
          },
        }),
        { status: 200, headers: { 'content-type': 'text/plain' } }
      )
  );
  const error = await refusal(url, { timeout: 50 });
  expect(error.code).toBe('timeout');
  expect(error.message).toBe(
    'File from files.test did not download within fileDownload.timeout (50 ms).'
  );
});

test('createFileDownload stops when the request it runs in is cancelled', async () => {
  const controller = new AbortController();
  mockFetchUrl.mockImplementation(async (link, { signal }) => {
    controller.abort();
    signal.throwIfAborted();
  });
  const error = await refusal(url, { signal: controller.signal });
  expect(error.name).toBe('AbortError');
});

test('createFileDownload reports a status that is not ok without the link', async () => {
  mockFetch({ status: 403, chunks: ['denied'] });
  const error = await refusal();
  expect(error.code).toBe('fetch_failed');
  expect(error.status).toBe(403);
  expect(error.message).toBe('File link to files.test answered 403.');
});

test('createFileDownload reports a failed fetch by host, not by link', async () => {
  mockFetchUrl.mockRejectedValue(
    new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND files.test') })
  );
  const error = await refusal();
  expect(error.code).toBe('fetch_failed');
  expect(error.message).toBe(
    'Could not download a file from files.test: getaddrinfo ENOTFOUND files.test'
  );
});

test('createFileDownload follows a redirect to an https link', async () => {
  mockFetchUrl.mockImplementation(async (link) => {
    if (link === url) {
      return new Response(null, { status: 302, headers: { location: '/moved/report.csv' } });
    }
    return new Response(bodyOf(['moved']), { status: 200, headers: { 'content-length': '5' } });
  });
  const file = await downloadOne();
  expect(mockFetchUrl.mock.calls.map(([link]) => link)).toEqual([
    url,
    'https://files.test/moved/report.csv',
  ]);
  expect(Buffer.from(file.data).toString()).toBe('moved');
  expect(file.mediaType).toBeUndefined();
});

test.each([['http://169.254.169.254/latest/meta-data/'], ['file:///etc/passwd']])(
  'createFileDownload refuses a redirect to %s before requesting it',
  async (location) => {
    mockFetchUrl.mockImplementation(
      async () => new Response(null, { status: 301, headers: { location } })
    );
    const error = await refusal();
    expect(error.code).toBe('url_not_https');
    expect(error.message).toBe('File link to files.test redirected to a link that is not https:.');
    expect(mockFetchUrl).toHaveBeenCalledTimes(1);
  }
);

test('createFileDownload refuses a link that redirects more than 10 times', async () => {
  mockFetchUrl.mockImplementation(
    async () => new Response(null, { status: 307, headers: { location: url } })
  );
  const error = await refusal();
  expect(error.code).toBe('fetch_failed');
  expect(error.message).toBe('File link to files.test redirected more than 10 times.');
  expect(mockFetchUrl).toHaveBeenCalledTimes(11);
});

test.each([
  ['https://127.0.0.1/report.csv'],
  ['https://10.0.0.1/report.csv'],
  ['https://169.254.169.254/latest/meta-data/'],
  ['https://[::1]/report.csv'],
  ['https://[::ffff:127.0.0.1]/report.csv'],
  ['https://[fd00::1]/report.csv'],
])('createFileDownload refuses %s with url_not_public before connecting', async (link) => {
  mockFetchUrl.mockImplementation(undici.fetch);
  const error = await refusal(link, { timeout: 2000 });
  expect(error.code).toBe('url_not_public');
  expect(error.message).toMatch(/^File link to .+ leads to an address that is not public\.$/);
  expect(mockConnect).not.toHaveBeenCalled();
});

test.each([['https://127.0.0.1/report.csv'], ['https://[::1]/report.csv']])(
  'createFileDownload refuses a redirect to %s with url_not_public before connecting',
  async (location) => {
    mockFetchUrl.mockImplementation(async (link, options) => {
      if (link === url) {
        return new Response(null, { status: 302, headers: { location } });
      }
      return undici.fetch(link, options);
    });
    const error = await refusal(url, { timeout: 2000 });
    expect(error.code).toBe('url_not_public');
    expect(mockFetchUrl.mock.calls.map(([link]) => link)).toEqual([url, location]);
    expect(mockConnect).not.toHaveBeenCalled();
  }
);

test('createFileDownload refuses a name that resolves to loopback with url_not_public', async () => {
  mockFetchUrl.mockImplementation(undici.fetch);
  const error = await refusal('https://localhost/report.csv?sig=secret', { timeout: 2000 });
  expect(error.code).toBe('url_not_public');
  expect(error.message).toBe('File link to localhost leads to an address that is not public.');
});

// A model that takes no file as a link, so the agent downloads every file it is given.
function createModel() {
  return new MockLanguageModelV4({
    supportedUrls: {},
    doGenerate: {
      content: [{ type: 'text', text: 'Read it.' }],
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 2, text: 2, reasoning: 0 },
      },
      warnings: [],
    },
  });
}

async function runAgent({ model, fileDownload }) {
  const { agentInstance } = await createToolLoopAgent({
    connection: { provider: () => model },
    agent: { agentId: 'report_agent', properties: { model: 'mock', fileDownload }, tools: [] },
    context: {
      agentContext: { sharedStateReadOnly: true },
      callEndpoint: jest.fn(),
      logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
    },
  });
  return agentInstance.generate({
    prompt: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Summarise the report.' },
          { type: 'file', data: new URL(url), mediaType: 'text/csv' },
        ],
      },
    ],
  });
}

test('an agent sends a file within fileDownload.maxBytes to the model as content', async () => {
  mockFetch({ chunks: ['a,b\n1,2\n'] });
  const model = createModel();
  await runAgent({ model, fileDownload: { maxBytes: 100 } });
  const user = model.doGenerateCalls[0].prompt.find((message) => message.role === 'user');
  const file = user.content.find((part) => part.type === 'file');
  expect(file.data).toEqual({ type: 'data', data: new Uint8Array(Buffer.from('a,b\n1,2\n')) });
  expect(file.mediaType).toBe('text/csv');
});

test('an agent refuses a file over fileDownload.maxBytes, with no link in the error', async () => {
  mockFetch({ chunks: ['a,b\n1,2\n'] });
  const model = createModel();
  let error;
  try {
    await runAgent({ model, fileDownload: { maxBytes: 4 } });
  } catch (caught) {
    error = caught;
  }
  expect(error.code).toBe('too_large');
  expect(model.doGenerateCalls).toHaveLength(0);
  const logged = JSON.stringify({ message: error.message, stack: error.stack, ...error });
  expect(logged).not.toContain('X-Amz-Signature');
  expect(logged).not.toContain('report.csv');
});
