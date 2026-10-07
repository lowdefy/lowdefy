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
const undici = jest.requireActual('undici');

jest.unstable_mockModule('undici', () => ({
  ...undici,
  fetch: (...fetchArgs) => mockFetchUrl(...fetchArgs),
}));

const { default: createGenerateText } = await import('./createGenerateText.js');
const { default: createGenerateObject } = await import('./createGenerateObject.js');

const url = 'https://files.test/report.csv?X-Amz-Signature=secret';

function mockFetch({ body = 'a,b\n1,2\n', status = 200 } = {}) {
  mockFetchUrl.mockImplementation(
    async () =>
      new Response(body, {
        status,
        headers: { 'content-type': 'text/csv', 'content-length': String(Buffer.byteLength(body)) },
      })
  );
}

// A model that takes no file as a link, so the server downloads every file it is given.
function createModel(text) {
  return new MockLanguageModelV4({
    supportedUrls: {},
    doGenerate: {
      content: [{ type: 'text', text }],
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 2, text: 2, reasoning: 0 },
      },
      warnings: [],
    },
  });
}

const messages = [
  {
    role: 'user',
    content: [
      { type: 'text', text: 'Summarise the report.' },
      { type: 'file', data: url, mediaType: 'text/csv' },
    ],
  },
];

const requests = {
  GenerateText: {
    createRequest: createGenerateText,
    modelText: 'Read it.',
    request: {},
  },
  GenerateObject: {
    createRequest: createGenerateObject,
    modelText: '{"summary":"Read it."}',
    request: {
      schema: {
        type: 'object',
        properties: { summary: { type: 'string' } },
        required: ['summary'],
      },
    },
  },
};

async function run({ requestType, fileDownload }) {
  const { createRequest, modelText, request } = requests[requestType];
  const model = createModel(modelText);
  const resolver = createRequest({ createProvider: () => () => model });
  let error = null;
  try {
    await resolver({
      connection: {},
      request: { model: 'mock', messages, fileDownload, ...request },
    });
  } catch (caught) {
    error = caught;
  }
  return { model, error };
}

function sentFile(model) {
  const user = model.doGenerateCalls[0].prompt.find((message) => message.role === 'user');
  return user.content.find((part) => part.type === 'file');
}

function logged(error) {
  return JSON.stringify({ message: error.message, stack: error.stack, ...error });
}

beforeEach(() => {
  mockFetchUrl.mockReset();
});

describe.each(Object.keys(requests))('%s', (requestType) => {
  test('sends a file within fileDownload.maxBytes to the model as content', async () => {
    mockFetch();
    const { model, error } = await run({ requestType, fileDownload: { maxBytes: 100 } });
    expect(error).toBe(null);
    const file = sentFile(model);
    expect(file.data).toEqual({ type: 'data', data: new Uint8Array(Buffer.from('a,b\n1,2\n')) });
    expect(file.mediaType).toBe('text/csv');
    const [link, options] = mockFetchUrl.mock.calls[0];
    expect(link).toBe(url);
    expect(options.dispatcher).toBeInstanceOf(undici.Agent);
  });

  test('refuses a file over fileDownload.maxBytes, with no link in the error', async () => {
    mockFetch();
    const { model, error } = await run({ requestType, fileDownload: { maxBytes: 4 } });
    expect(error.code).toBe('too_large');
    expect(error.message).toBe(
      'File from files.test is larger than fileDownload.maxBytes (4 bytes).'
    );
    expect(model.doGenerateCalls).toHaveLength(0);
    expect(logged(error)).not.toContain('X-Amz-Signature');
    expect(logged(error)).not.toContain('report.csv');
  });

  test('reports a failed download with no link in the error', async () => {
    mockFetch({ status: 403 });
    const { model, error } = await run({ requestType });
    expect(error.code).toBe('fetch_failed');
    expect(error.message).toBe('File link to files.test answered 403.');
    expect(model.doGenerateCalls).toHaveLength(0);
    expect(logged(error)).not.toContain('X-Amz-Signature');
    expect(logged(error)).not.toContain('report.csv');
  });

  test('refuses a link to an address that is not public before connecting', async () => {
    mockFetchUrl.mockImplementation(undici.fetch);
    const { createRequest, modelText, request } = requests[requestType];
    const model = createModel(modelText);
    const resolver = createRequest({ createProvider: () => () => model });
    await expect(
      resolver({
        connection: {},
        request: {
          model: 'mock',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'file', data: 'https://169.254.169.254/latest/', mediaType: 'text/csv' },
              ],
            },
          ],
          fileDownload: { timeout: 2000 },
          ...request,
        },
      })
    ).rejects.toMatchObject({ code: 'url_not_public' });
    expect(model.doGenerateCalls).toHaveLength(0);
  });
});
