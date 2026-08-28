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

// The report key's shape is validated by the lowdefy schema. This step covers
// what the schema cannot: a hard reject of the reserved chromium rendering mode,
// and collecting sheet names so buildPage can warn on duplicates within a page.
function validateReport(block, pageContext) {
  if (type.isNone(block.report)) return;
  const configKey = block['~k'];

  if (!type.isNone(block.report.rendering)) {
    throw new ConfigError(
      `Report "rendering" on block "${block.blockId}" on page "${pageContext.pageId}" is reserved and not yet supported (received ${JSON.stringify(
        block.report.rendering
      )}).`,
      { configKey }
    );
  }

  if (!type.isNone(block.report.sheetName)) {
    pageContext.sheetNameRefs.push({
      sheetName: block.report.sheetName,
      blockId: block.blockId,
      configKey,
    });
  }
}

export default validateReport;
