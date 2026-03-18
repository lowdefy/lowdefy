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

function moveAreasToSlots(block, pageContext) {
  if (!type.isNone(block.areas)) {
    if (!type.isNone(block.slots)) {
      throw new ConfigError(
        `Block "${block.blockId}" on page "${pageContext.pageId}" cannot have both "areas" and "slots". Use "slots".`,
        { configKey: block['~k'] }
      );
    }
    pageContext.context.handleWarning(
      new ConfigWarning(
        `Block "${block.blockId}" on page "${pageContext.pageId}": "areas" is deprecated, use "slots".`,
        { configKey: block['~k'] }
      )
    );
    block.slots = block.areas;
    delete block.areas;
  }
}

export default moveAreasToSlots;
