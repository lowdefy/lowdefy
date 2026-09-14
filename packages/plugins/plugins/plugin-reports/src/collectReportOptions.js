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

// Collect per-block `report:` options from the built page config, keyed by
// blockId — the shape walkBlocks consumes ({ [blockId]: { exclude, sheetName,
// pageBreakBefore } }). The `report` key lives on the built block JSON, not on
// the evaluated engine tree (the engine drops keys it does not know), so the
// options must be read here, from the config the engine is about to consume.
//
// Children nest under `block.slots.{area}.blocks[]` after the build's
// moveAreasToSlots step. List item blocks carry their pattern blockId here;
// walkBlocks falls back to that pattern for the indexed instances at render time.
function collectReportOptions(pageConfig) {
  const options = {};

  const visit = (block) => {
    if (type.isNone(block)) return;
    if (type.isObject(block.report)) {
      options[block.blockId] = block.report;
    }
    Object.values(block.slots ?? {}).forEach((area) => {
      (area?.blocks ?? []).forEach(visit);
    });
  };

  visit(pageConfig);
  return options;
}

export default collectReportOptions;
