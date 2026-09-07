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
import buildTestPage from '@lowdefy/build/buildTestPage';
import { serializer } from '@lowdefy/helpers';
import * as operatorsClient from '@lowdefy/operators-js/operators/client';

// The Html renderer wraps a native layout engine the pages here never reach;
// stub it so the suite runs the real pipeline without loading it.
jest.unstable_mockModule('../../../render/html/createHtmlRenderer.js', () => ({
  default: jest.fn(() => async ({ width }) => ({ svg: '<svg/>', width, height: 10 })),
}));

const { default: RenderReport } = await import('./RenderReport.js');

// A real generation end to end: the resolver reads the page through the app
// capability, evaluates it headlessly with the real engine and operators, walks
// it through an inline renderer registry, and returns pdfmake's bytes.
const registry = {
  Title: {
    toReport: ({ block }) => ({ kind: 'heading', text: block.properties.content, level: 1 }),
  },
  Paragraph: {
    toReport: ({ block }) => ({ kind: 'text', text: block.properties.content }),
  },
};

const blockMetas = {
  Box: { category: 'container' },
  Title: { category: 'display' },
  Paragraph: { category: 'display' },
};

// getPageConfig serializes the built page for JSON transfer, as core does.
function page(pageConfig) {
  return serializer.serialize(buildTestPage({ pageConfig }));
}

function makeApp(overrides = {}) {
  return {
    getPageConfig: jest.fn(async () =>
      page({
        id: 'page1',
        type: 'Box',
        properties: { title: 'Quarterly' },
        blocks: [
          { id: 't', type: 'Title', properties: { content: 'Quarterly report' } },
          {
            id: 'p',
            type: 'Paragraph',
            properties: { content: { '_string.concat': ['Prepared for ', { _user: 'name' }] } },
          },
        ],
      })
    ),
    readBlockMetas: jest.fn(async () => blockMetas),
    readGlobal: jest.fn(async () => ({})),
    readReportStylesheet: jest.fn(async () => undefined),
    callRequest: jest.fn(async () => ({ response: null })),
    blocksStatic: registry,
    clientOperators: { ...operatorsClient },
    clientJsMap: {},
    icons: {},
    origin: 'https://app.example.com',
    publicDirectory: '/srv/app/public',
    renderDepth: 0,
    requestTimeout: 30000,
    system: false,
    user: { id: 'user_1', name: 'Ada' },
    logger: { debug: () => {}, warn: () => {}, error: () => {}, info: () => {} },
    ...overrides,
  };
}

function decode(result) {
  return Buffer.from(result.content, 'base64');
}

describe('meta', () => {
  test('declares appAccess and read-only access', () => {
    expect(RenderReport.meta).toEqual({ appAccess: true, checkRead: true, checkWrite: false });
    expect(RenderReport.schema).toBeDefined();
    expect(RenderReport.schema.required).toEqual(['pageId']);
  });
});

describe('a real render through the app capability', () => {
  test('returns a base64 PDF envelope for a page the user may view', async () => {
    const app = makeApp();
    const result = await RenderReport({ request: { pageId: 'page1' }, app });

    expect(result.name).toBe('page1.pdf');
    expect(result.type).toBe('application/pdf');
    const bytes = decode(result);
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(result.size).toBe(bytes.length);
    expect(app.getPageConfig).toHaveBeenCalledWith({ pageId: 'page1', urlQuery: undefined });
    expect(app.readBlockMetas).toHaveBeenCalledTimes(1);
    expect(app.readGlobal).toHaveBeenCalledTimes(1);
    expect(app.readReportStylesheet).toHaveBeenCalledTimes(1);
  });

  test('an anonymous visitor on a public page is still a user render', async () => {
    // No session, but not a system context: _user resolves to nothing instead of
    // tripping the schedule guard.
    const app = makeApp({ user: undefined, system: false });
    const result = await RenderReport({ request: { pageId: 'page1' }, app });
    expect(decode(result).subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  test('a system render of a page that reads _user is refused', async () => {
    const app = makeApp({ user: undefined, system: true });
    await expect(RenderReport({ request: { pageId: 'page1' }, app })).rejects.toThrow(
      /uses _user and cannot be rendered on a schedule/
    );
  });

  test('a requested filename overrides the generated one; an unsafe one falls back', async () => {
    const named = await RenderReport({
      request: { pageId: 'page1', filename: 'Q1.pdf' },
      app: makeApp(),
    });
    expect(named.name).toBe('Q1.pdf');
    const unsafe = await RenderReport({
      request: { pageId: 'page1', filename: '/\\"' },
      app: makeApp(),
    });
    expect(unsafe.name).toBe('page1.pdf');
  });

  test('a failed onInit request fails the render rather than shipping an empty report', async () => {
    const app = makeApp({
      callRequest: jest.fn(async () => {
        throw new Error('database unreachable');
      }),
      getPageConfig: jest.fn(async () =>
        page({
          id: 'page1',
          type: 'Box',
          requests: [{ id: 'getData', type: 'Fetch' }],
          events: { onInit: [{ id: 'req', type: 'Request', params: 'getData' }] },
          blocks: [{ id: 't', type: 'Title', properties: { content: 'x' } }],
        })
      ),
    });
    await expect(RenderReport({ request: { pageId: 'page1' }, app })).rejects.toThrow(
      /1 action errored during onInit/
    );
  });
});

describe('authorization masking', () => {
  test('throws one generic error and never renders when the page is null', async () => {
    const app = makeApp({ getPageConfig: jest.fn(async () => null) });
    await expect(RenderReport({ request: { pageId: 'secret' }, app })).rejects.toThrow(
      "Report cannot be rendered for page 'secret'."
    );
    expect(app.readBlockMetas).not.toHaveBeenCalled();
  });
});

describe('report-in-report guard', () => {
  test('refuses to render when reached at a non-zero render depth', async () => {
    const app = makeApp({ renderDepth: 1 });
    await expect(RenderReport({ request: { pageId: 'page1' }, app })).rejects.toThrow(
      "Report for page 'page1' cannot be rendered from within another report."
    );
    expect(app.getPageConfig).not.toHaveBeenCalled();
  });
});
