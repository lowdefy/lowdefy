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

import { type } from '@lowdefy/helpers';
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

// Options that describe the document, read from the page block only.
const PAGE_LEVEL_KEYS = ['title', 'header', 'footer', 'size', 'orientation'];
// Options that describe one block's place in the document, never the page.
const BLOCK_LEVEL_KEYS = ['exclude', 'pageBreakBefore', 'sheetName'];

// Excel refuses this worksheet name outright (case-insensitively); ExcelJS
// throws when asked to create it.
const RESERVED_SHEET_NAME = 'history';

function validateSheetName({ sheetName, blockId, pageId, configKey }) {
  if (sheetName.startsWith("'") || sheetName.endsWith("'")) {
    throw new ConfigError(
      `Report "sheetName" on block "${blockId}" on page "${pageId}" may not begin or end with an apostrophe (received ${JSON.stringify(
        sheetName
      )}).`,
      { configKey }
    );
  }
  if (sheetName.toLowerCase() === RESERVED_SHEET_NAME) {
    throw new ConfigError(
      `Report "sheetName" on block "${blockId}" on page "${pageId}" may not be "History", which Excel reserves (received ${JSON.stringify(
        sheetName
      )}).`,
      { configKey }
    );
  }
}

// The report key's shape is validated by the lowdefy schema. This step covers
// what the schema cannot see: which block the key sits on, the worksheet name
// rules Excel enforces beyond its character set, and collecting references for
// the page-level checks buildPage runs once every block is built.
function validateReport(block, pageContext) {
  if (type.isNone(block.report)) return;
  const { pageId } = pageContext;
  const configKey = block['~k'];
  const isPageBlock = block === pageContext.pageBlock;

  pageContext.reportRefs.push({ blockId: block.blockId, configKey });

  const misplacedKeys = (isPageBlock ? BLOCK_LEVEL_KEYS : PAGE_LEVEL_KEYS).filter(
    (key) => !type.isNone(block.report[key])
  );
  if (misplacedKeys.length > 0) {
    const where = isPageBlock ? 'the page block' : 'a block inside the page';
    const scope = isPageBlock ? 'apply to blocks inside the page' : 'apply to the page block';
    pageContext.context.handleWarning(
      new ConfigWarning(
        `Report option(s) ${misplacedKeys.map((key) => `"${key}"`).join(', ')} on block "${
          block.blockId
        }" on page "${pageId}" ${scope} and are ignored on ${where}.`,
        { configKey }
      )
    );
  }

  if (!isPageBlock && type.isString(block.report.sheetName)) {
    validateSheetName({
      sheetName: block.report.sheetName,
      blockId: block.blockId,
      pageId,
      configKey,
    });
    pageContext.sheetNameRefs.push({
      sheetName: block.report.sheetName,
      blockId: block.blockId,
      configKey,
    });
  }
}

export default validateReport;
