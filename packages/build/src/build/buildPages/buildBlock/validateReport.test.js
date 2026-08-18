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

import { ConfigError } from '@lowdefy/errors';

import validateReport from './validateReport.js';

function createPageContext() {
  return { pageId: 'page1', sheetNameRefs: [] };
}

test('validateReport does nothing when block has no report key', () => {
  const pageContext = createPageContext();
  validateReport({ blockId: 'b1', type: 'Card' }, pageContext);
  expect(pageContext.sheetNameRefs).toEqual([]);
});

test('validateReport ignores a report key without a sheetName', () => {
  const pageContext = createPageContext();
  validateReport(
    { blockId: 'b1', type: 'Card', report: { exclude: true }, '~k': 'k1' },
    pageContext
  );
  expect(pageContext.sheetNameRefs).toEqual([]);
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

test('validateReport throws a ConfigError for any reserved rendering value', () => {
  const pageContext = createPageContext();
  expect(() =>
    validateReport(
      { blockId: 'page1', type: 'Box', report: { rendering: 'chromium' }, '~k': 'k1' },
      pageContext
    )
  ).toThrow(ConfigError);
  expect(() =>
    validateReport(
      { blockId: 'page1', type: 'Box', report: { rendering: 'chromium' }, '~k': 'k1' },
      pageContext
    )
  ).toThrow('Report "rendering" on block "page1" on page "page1" is reserved and not yet supported');
});
