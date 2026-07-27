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
import DownloadReport from './DownloadReport.js';

const mockFetch = jest.fn();
const mockCreateObjectURL = jest.fn(() => 'blob:report');
const mockClick = jest.fn();
const mockSetAttribute = jest.fn();
const mockCreateElement = jest.fn(() => ({
  click: mockClick,
  setAttribute: mockSetAttribute,
}));

const methods = {
  getPageId: () => 'dashboard',
  getInput: () => ({ id: 1 }),
  getState: () => ({ filter: 'open' }),
  getUrlQuery: () => ({ tab: 'sales' }),
};

const globals = {
  basePath: '/app',
  document: { createElement: mockCreateElement },
  fetch: mockFetch,
  window: { URL: { createObjectURL: mockCreateObjectURL } },
};

const response = ({ ok = true, status = 200, headers = {}, size = 9, text = '' } = {}) => ({
  ok,
  status,
  headers: { get: (key) => headers[key.toLowerCase()] ?? null },
  arrayBuffer: async () => new Uint8Array(size).buffer,
  text: async () => text,
});

const requestBody = () => JSON.parse(mockFetch.mock.calls[0][1].body);

beforeEach(() => {
  mockFetch.mockReset();
  mockCreateObjectURL.mockClear();
  mockClick.mockClear();
  mockSetAttribute.mockClear();
  mockCreateElement.mockClear();
  mockCreateObjectURL.mockReturnValue('blob:report');
});

test('default params post the current page snapshot', async () => {
  mockFetch.mockResolvedValue(response());
  await DownloadReport({ globals, methods });
  expect(mockFetch.mock.calls[0][0]).toEqual('/app/api/report/dashboard');
  expect(mockFetch.mock.calls[0][1]).toMatchObject({
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  expect(requestBody()).toEqual({
    format: 'pdf',
    urlQuery: { tab: 'sales' },
    input: { id: 1 },
    state: { filter: 'open' },
  });
});

test('explicit params override the snapshot', async () => {
  mockFetch.mockResolvedValue(response());
  await DownloadReport({
    globals,
    methods,
    params: { format: 'xlsx', filename: 'sales.xlsx', state: { filter: 'closed' } },
  });
  expect(requestBody()).toEqual({
    format: 'xlsx',
    filename: 'sales.xlsx',
    urlQuery: { tab: 'sales' },
    input: { id: 1 },
    state: { filter: 'closed' },
  });
});

test('a report of another page omits the snapshot', async () => {
  mockFetch.mockResolvedValue(response());
  await DownloadReport({ globals, methods, params: { pageId: 'monthly-summary' } });
  expect(mockFetch.mock.calls[0][0]).toEqual('/app/api/report/monthly-summary');
  expect(requestBody()).toEqual({ format: 'pdf' });
});

test('a report of another page sends only explicit context', async () => {
  mockFetch.mockResolvedValue(response());
  await DownloadReport({
    globals,
    methods,
    params: { pageId: 'monthly-summary', state: { month: '2026-07' } },
  });
  expect(requestBody()).toEqual({ format: 'pdf', state: { month: '2026-07' } });
});

test('the url has no basePath prefix when the app has none', async () => {
  mockFetch.mockResolvedValue(response());
  await DownloadReport({ globals: { ...globals, basePath: undefined }, methods });
  expect(mockFetch.mock.calls[0][0]).toEqual('/api/report/dashboard');
});

test('a successful response downloads the file from the content disposition filename', async () => {
  mockFetch.mockResolvedValue(
    response({
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="dashboard.pdf"',
      },
    })
  );
  const anchor = { click: mockClick, setAttribute: mockSetAttribute };
  mockCreateElement.mockReturnValue(anchor);

  await DownloadReport({ globals, methods });

  expect(mockCreateElement.mock.calls).toEqual([['a']]);
  const blob = mockCreateObjectURL.mock.calls[0][0];
  expect(blob.type).toEqual('application/pdf');
  expect(blob.size).toEqual(9);
  expect(anchor.href).toEqual('blob:report');
  expect(mockSetAttribute.mock.calls).toEqual([['download', 'dashboard.pdf']]);
  expect(mockClick).toHaveBeenCalledTimes(1);
});

test('the filename param wins over the content disposition filename', async () => {
  mockFetch.mockResolvedValue(
    response({
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': 'attachment; filename="dashboard.xlsx"',
      },
    })
  );
  await DownloadReport({ globals, methods, params: { format: 'xlsx', filename: 'sales.xlsx' } });
  expect(mockCreateObjectURL.mock.calls[0][0].type).toEqual(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  expect(mockSetAttribute.mock.calls).toEqual([['download', 'sales.xlsx']]);
});

test('the filename falls back to the page id and format', async () => {
  mockFetch.mockResolvedValue(response());
  await DownloadReport({ globals, methods, params: { pageId: 'reports/monthly' } });
  expect(mockCreateObjectURL.mock.calls[0][0].type).toEqual('application/octet-stream');
  expect(mockSetAttribute.mock.calls).toEqual([['download', 'monthly.pdf']]);
});

test('a 404 response throws the server message', async () => {
  mockFetch.mockResolvedValue(response({ ok: false, status: 404, text: 'Not found' }));
  await expect(DownloadReport({ globals, methods })).rejects.toThrow('Not found');
  expect(mockClick).not.toHaveBeenCalled();
});

test('an error response with an empty body throws the status', async () => {
  mockFetch.mockResolvedValue(response({ ok: false, status: 500 }));
  await expect(DownloadReport({ globals, methods })).rejects.toThrow(
    'Report request failed with status 500.'
  );
});
