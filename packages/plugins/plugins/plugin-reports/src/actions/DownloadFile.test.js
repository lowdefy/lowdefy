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

import DownloadFile from './DownloadFile.js';

// The action runs in the browser; stub the DOM/File globals it reaches for.
class MockBlob {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options?.type;
  }
}

let anchor;
let originals;

beforeEach(() => {
  anchor = { href: '', setAttribute: jest.fn(), click: jest.fn() };
  originals = {
    document: global.document,
    Blob: global.Blob,
    createObjectURL: global.URL.createObjectURL,
    revokeObjectURL: global.URL.revokeObjectURL,
  };
  global.document = { createElement: jest.fn(() => anchor) };
  global.Blob = MockBlob;
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  global.document = originals.document;
  global.Blob = originals.Blob;
  global.URL.createObjectURL = originals.createObjectURL;
  global.URL.revokeObjectURL = originals.revokeObjectURL;
});

test('decodes the base64 envelope into a typed Blob and clicks a download anchor', () => {
  const content = Buffer.from('%PDF-1.7 bytes').toString('base64');
  DownloadFile({ params: { name: 'report.pdf', type: 'application/pdf', content } });

  const blob = global.URL.createObjectURL.mock.calls[0][0];
  expect(blob).toBeInstanceOf(MockBlob);
  expect(blob.type).toBe('application/pdf');
  // The decoded bytes round-trip back to the original content.
  expect(Buffer.from(blob.parts[0]).toString('latin1')).toBe('%PDF-1.7 bytes');

  expect(anchor.href).toBe('blob:mock-url');
  expect(anchor.setAttribute).toHaveBeenCalledWith('download', 'report.pdf');
  expect(anchor.click).toHaveBeenCalledTimes(1);
  expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
});

test('defaults the Blob type when the envelope omits it', () => {
  DownloadFile({ params: { name: 'file.bin', content: Buffer.from('x').toString('base64') } });
  expect(global.URL.createObjectURL.mock.calls[0][0].type).toBe('application/octet-stream');
});

test('throws when content is not a base64 string', () => {
  expect(() => DownloadFile({ params: { name: 'r.pdf' } })).toThrow(/base64 "content" string/);
  expect(() => DownloadFile({ params: { name: 'r.pdf', content: 123 } })).toThrow(
    /base64 "content" string/
  );
});

test('throws when name is missing or empty', () => {
  const content = Buffer.from('x').toString('base64');
  expect(() => DownloadFile({ params: { content } })).toThrow(/"name" string/);
  expect(() => DownloadFile({ params: { name: '', content } })).toThrow(/"name" string/);
});
