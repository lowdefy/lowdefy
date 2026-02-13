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

import { nunjucksFunction } from '@lowdefy/nunjucks';
import { ConfigError } from '@lowdefy/errors/build';

function createCheckDuplicateId({ message, context }) {
  const template = nunjucksFunction(message);
  const ids = new Set();
  function checkDuplicateId({ id, blockId, configKey, eventId, menuId, pageId }) {
    if (ids.has(id.toLowerCase())) {
      const errorMessage = template({ id, blockId, eventId, menuId, pageId });
      throw new ConfigError({
        message: errorMessage,
        configKey,
        context,
      });
    }
    ids.add(id.toLowerCase());
  }
  return checkDuplicateId;
}

export default createCheckDuplicateId;
