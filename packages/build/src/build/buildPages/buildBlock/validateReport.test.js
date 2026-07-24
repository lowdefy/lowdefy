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

import buildPages from '../../full/buildPages.js';
import testContext from '../../../test-utils/testContext.js';

const mockLogWarn = jest.fn();
const context = testContext({ logger: { warn: mockLogWarn } });

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('valid page and block report keys survive into the built page JSON', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Box',
        report: {
          title: 'Monthly Sales Report',
          size: 'A4',
          orientation: 'portrait',
          footer: 'Confidential',
          rendering: 'document',
        },
        blocks: [
          {
            id: 'box_1',
            type: 'Box',
            report: { exclude: true },
          },
          {
            id: 'box_2',
            type: 'Box',
            report: { pageBreakBefore: true, sheetName: 'Regional Sales' },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  const page = res.pages[0];
  expect(page.report).toEqual({
    title: 'Monthly Sales Report',
    size: 'A4',
    orientation: 'portrait',
    footer: 'Confidential',
    rendering: 'document',
  });
  const [box1, box2] = page.slots.content.blocks;
  expect(box1.report).toEqual({ exclude: true });
  expect(box2.report).toEqual({ pageBreakBefore: true, sheetName: 'Regional Sales' });
});

test('rendering "document" passes', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Box',
        report: { rendering: 'document' },
      },
    ],
  };
  expect(() => buildPages({ components, context })).not.toThrow();
});

test('rendering "chromium" is reserved and throws', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Box',
        report: { rendering: 'chromium' },
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    "report.rendering 'chromium' is reserved and not yet supported"
  );
});

test('sheetName with an invalid character throws', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Box',
        blocks: [
          {
            id: 'box_1',
            type: 'Box',
            report: { sheetName: 'Q1/Q2' },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'report.sheetName "Q1/Q2" on block "box_1" on page "page_1" contains an invalid character. The characters [ ] : * ? / \\ are not allowed.'
  );
});

test('sheetName longer than 31 characters throws', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Box',
        blocks: [
          {
            id: 'box_1',
            type: 'Box',
            report: { sheetName: 'A234567890123456789012345678901234567890' },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'exceeds the maximum length of 31 characters'
  );
});

test('duplicate sheetNames within a page emit a warning', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Box',
        blocks: [
          {
            id: 'box_1',
            type: 'Box',
            report: { sheetName: 'Sales' },
          },
          {
            id: 'box_2',
            type: 'Box',
            report: { sheetName: 'Sales' },
          },
        ],
      },
    ],
  };
  buildPages({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'Duplicate report sheetName "Sales" on block "box_2" on page "page_1" — already defined on block "box_1".'
  );
});
