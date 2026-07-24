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
import { ConfigError } from '@lowdefy/errors';

// Excel worksheet name constraints: the characters [ ] : * ? / \ are forbidden
// and the name may be at most 31 characters long.
const INVALID_SHEET_NAME_CHARS = /[[\]:*?/\\]/;
const MAX_SHEET_NAME_LENGTH = 31;

function validateReport(block, pageContext) {
  const { report } = block;
  if (type.isNone(report)) return;
  if (!type.isObject(report)) {
    throw new ConfigError(
      `Block "report" should be an object at "${block.blockId}" on page "${pageContext.pageId}".`,
      { received: report, configKey: block['~k'] }
    );
  }
  // The chromium renderer is reserved for a future sub-design. Reject it
  // explicitly so authors know it is planned, not a typo. "document" and
  // absence pass.
  if (report.rendering === 'chromium') {
    throw new ConfigError("report.rendering 'chromium' is reserved and not yet supported", {
      configKey: block['~k'],
    });
  }
  if (type.isString(report.sheetName)) {
    const { sheetName } = report;
    if (INVALID_SHEET_NAME_CHARS.test(sheetName)) {
      throw new ConfigError(
        `report.sheetName "${sheetName}" on block "${block.blockId}" on page "${pageContext.pageId}" contains an invalid character. The characters [ ] : * ? / \\ are not allowed.`,
        { received: sheetName, configKey: block['~k'] }
      );
    }
    if (sheetName.length > MAX_SHEET_NAME_LENGTH) {
      throw new ConfigError(
        `report.sheetName "${sheetName}" on block "${block.blockId}" on page "${pageContext.pageId}" exceeds the maximum length of ${MAX_SHEET_NAME_LENGTH} characters.`,
        { received: sheetName, configKey: block['~k'] }
      );
    }
    pageContext.reportSheetNameRefs.push({
      sheetName,
      blockId: block.blockId,
      configKey: block['~k'],
    });
  }
}

export default validateReport;
