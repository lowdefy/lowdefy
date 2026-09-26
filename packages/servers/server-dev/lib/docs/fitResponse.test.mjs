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

import fitResponse, { MAX_INLINE_RESPONSE_CHARS, MAX_SAVED_RESPONSES } from './fitResponse.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-fit-response-'));
  process.env.LOWDEFY_DIRECTORY_CONFIG = configDirectory;
});

afterEach(() => {
  delete process.env.LOWDEFY_DIRECTORY_CONFIG;
});

test('fitResponse returns the result untouched when the response fits', () => {
  const result = { refused: false, response: [{ _id: 1 }], status: 'success' };

  expect(fitResponse({ result, name: 'home.get_rows' })).toBe(result);
  expect(fs.existsSync(path.join(configDirectory, '.lowdefy'))).toBe(false);
});

test('fitResponse keeps a null response untouched', () => {
  const result = { response: null, status: 'success' };

  expect(fitResponse({ result, name: 'home.get_rows' })).toBe(result);
});

test('fitResponse keeps a result with no response untouched', () => {
  // A failed routine, or one that ends without :return, has no response.
  const result = {
    error: { '~e': { name: 'ServiceError', message: 'Something went wrong.' } },
    response: undefined,
    status: 'error',
    success: false,
  };

  expect(fitResponse({ result, name: 'search' })).toBe(result);
  expect(fs.existsSync(path.join(configDirectory, '.lowdefy'))).toBe(false);
});

test('fitResponse writes an oversized response to a file and returns its path in its place', () => {
  const rows = Array.from({ length: 500 }, (_, index) => ({ _id: index, title: 'x'.repeat(100) }));
  const result = { response: rows, status: 'success', error: null };

  const fitted = fitResponse({ result, name: 'tasks/list.get_rows' });

  expect(fitted.response).toBeUndefined();
  expect(fitted.status).toBe('success');
  expect(fitted.error).toBeNull();
  expect(fitted.responseItems).toBe(500);
  expect(fitted.responseChars).toBe(JSON.stringify(rows).length);
  expect(fitted.responseChars).toBeGreaterThan(MAX_INLINE_RESPONSE_CHARS);
  expect(fitted.note).toContain('written in full to responseFile');
  expect(path.dirname(fitted.responseFile)).toBe(
    path.join(configDirectory, '.lowdefy', 'responses')
  );
  expect(path.basename(fitted.responseFile).startsWith('tasks_list.get_rows-')).toBe(true);
  expect(JSON.parse(fs.readFileSync(fitted.responseFile, 'utf8'))).toEqual(rows);
  expect(result.response).toBe(rows);
});

test('fitResponse writes a small response to a file when saveResponse is set', () => {
  const result = { response: { total: 3 }, status: 'success' };

  const fitted = fitResponse({ result, name: 'report', saveResponse: true });

  expect(fitted.response).toBeUndefined();
  expect(fitted.responseItems).toBeUndefined();
  expect(fitted.note).toBe('The full response was written to responseFile.');
  expect(JSON.parse(fs.readFileSync(fitted.responseFile, 'utf8'))).toEqual({ total: 3 });
});

test('fitResponse writes a missing response as null when saveResponse is set', () => {
  const result = { status: 'success' };

  const fitted = fitResponse({ result, name: 'home.update_row', saveResponse: true });

  expect(fitted.responseChars).toBe(4);
  expect(JSON.parse(fs.readFileSync(fitted.responseFile, 'utf8'))).toBeNull();
});

test('fitResponse gives every saved response its own file', () => {
  const files = Array.from({ length: 5 }, (_, index) =>
    fitResponse({ result: { response: { index } }, name: 'same', saveResponse: true })
  ).map(({ responseFile }) => responseFile);

  expect(new Set(files).size).toBe(5);
  files.forEach((file, index) => {
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toEqual({ index });
  });
});

test('fitResponse keeps only the most recent saved responses', () => {
  const directory = path.join(configDirectory, '.lowdefy', 'responses');
  fs.mkdirSync(directory, { recursive: true });
  const old = path.join(directory, 'old-response.json');
  fs.writeFileSync(old, '{}');
  const longAgo = new Date('2000-01-01T00:00:00.000Z');
  fs.utimesSync(old, longAgo, longAgo);

  const files = Array.from({ length: MAX_SAVED_RESPONSES }, (_, index) =>
    fitResponse({ result: { response: { index } }, name: 'report', saveResponse: true })
  ).map(({ responseFile }) => responseFile);

  const kept = fs.readdirSync(directory).map((fileName) => path.join(directory, fileName));
  expect(kept).toHaveLength(MAX_SAVED_RESPONSES);
  expect(kept).not.toContain(old);
  expect(kept.sort()).toEqual([...files].sort());
});
