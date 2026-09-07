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
import { ConfigError } from '@lowdefy/errors';

import validateReport from './validateReport.js';

const pageBlock = { id: 'page1', blockId: 'page1', type: 'Box', '~k': 'kpage' };

function createPageContext() {
  return {
    pageId: 'page1',
    pageBlock,
    reportRefs: [],
    sheetNameRefs: [],
    context: { handleWarning: jest.fn() },
  };
}

test('validateReport does nothing when block has no report key', () => {
  const pageContext = createPageContext();
  validateReport({ blockId: 'b1', type: 'Card' }, pageContext);
  expect(pageContext.reportRefs).toEqual([]);
  expect(pageContext.sheetNameRefs).toEqual([]);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateReport records every block that carries a report key', () => {
  const pageContext = createPageContext();
  validateReport(
    { blockId: 'b1', type: 'Card', report: { exclude: true }, '~k': 'k1' },
    pageContext
  );
  expect(pageContext.reportRefs).toEqual([{ blockId: 'b1', configKey: 'k1' }]);
  expect(pageContext.sheetNameRefs).toEqual([]);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateReport collects sheet names for duplicate detection', () => {
  const pageContext = createPageContext();
  validateReport(
    { blockId: 'grid1', type: 'AgGrid', report: { sheetName: 'Sales' }, '~k': 'k1' },
    pageContext
  );
  expect(pageContext.sheetNameRefs).toEqual([
    { sheetName: 'Sales', blockId: 'grid1', configKey: 'k1' },
  ]);
});

test('validateReport accepts page-level options on the page block without warning', () => {
  const pageContext = createPageContext();
  const block = { ...pageBlock, report: { title: 'Q1', size: 'A4', orientation: 'landscape' } };
  pageContext.pageBlock = block;
  validateReport(block, pageContext);
  expect(pageContext.context.handleWarning).not.toHaveBeenCalled();
});

test('validateReport warns when page-level options sit on a block inside the page', () => {
  const pageContext = createPageContext();
  validateReport(
    { blockId: 'b1', type: 'Card', report: { title: 'Q1', size: 'A4' }, '~k': 'k1' },
    pageContext
  );
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
  const warning = pageContext.context.handleWarning.mock.calls[0][0];
  expect(warning.message).toBe(
    'Report option(s) "title", "size" on block "b1" on page "page1" apply to the page block and are ignored on a block inside the page.'
  );
  expect(warning.configKey).toBe('k1');
});

test('validateReport warns when block-level options sit on the page block', () => {
  const pageContext = createPageContext();
  const block = { ...pageBlock, report: { exclude: true, sheetName: 'Sales' } };
  pageContext.pageBlock = block;
  validateReport(block, pageContext);
  expect(pageContext.context.handleWarning).toHaveBeenCalledTimes(1);
  expect(pageContext.context.handleWarning.mock.calls[0][0].message).toBe(
    'Report option(s) "exclude", "sheetName" on block "page1" on page "page1" apply to blocks inside the page and are ignored on the page block.'
  );
  // A sheet name on the page block names no worksheet, so it is not collected.
  expect(pageContext.sheetNameRefs).toEqual([]);
});

test('validateReport throws when a sheetName begins or ends with an apostrophe', () => {
  const pageContext = createPageContext();
  expect(() =>
    validateReport(
      { blockId: 'g1', type: 'AgGrid', report: { sheetName: "'Sales" }, '~k': 'k1' },
      pageContext
    )
  ).toThrow(ConfigError);
  expect(() =>
    validateReport(
      { blockId: 'g1', type: 'AgGrid', report: { sheetName: "Sales'" }, '~k': 'k1' },
      pageContext
    )
  ).toThrow(
    'Report "sheetName" on block "g1" on page "page1" may not begin or end with an apostrophe (received "Sales\'").'
  );
});

test('validateReport throws when a sheetName is the reserved name History in any case', () => {
  const pageContext = createPageContext();
  expect(() =>
    validateReport(
      { blockId: 'g1', type: 'AgGrid', report: { sheetName: 'history' }, '~k': 'k1' },
      pageContext
    )
  ).toThrow(
    'Report "sheetName" on block "g1" on page "page1" may not be "History", which Excel reserves (received "history").'
  );
});

test('validateReport accepts an apostrophe inside a sheetName', () => {
  const pageContext = createPageContext();
  validateReport(
    { blockId: 'g1', type: 'AgGrid', report: { sheetName: "Q1's Sales" }, '~k': 'k1' },
    pageContext
  );
  expect(pageContext.sheetNameRefs[0].sheetName).toBe("Q1's Sales");
});
