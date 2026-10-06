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

import { parsePathPattern, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import validateId from '../../utils/validateId.js';

// A page's route: its path pattern, or its id as an all-fixed pattern when it
// declares no path. The id is checked here, not only in buildPage, because the
// JIT skeleton writes routes.json without building pages that have a source
// file, and the server matcher parses every route.
function parsePageRoute({ page }) {
  const configKey = page['~k'];
  if (type.isUndefined(page.path)) {
    validateId({ id: page.id, field: 'Page id', configKey });
    if (page.id.split('/').some((segment) => segment === '')) {
      throw new ConfigError(
        `Page id "${page.id}" contains an empty segment. Page ids cannot start or end with "/" or contain "//".`,
        { configKey }
      );
    }
    return {
      pageId: page.id,
      path: page.id,
      segments: page.id.split('/').map((fixed) => ({ fixed })),
      configKey,
    };
  }
  if (!type.isString(page.path)) {
    throw new ConfigError(
      `Page "${page.id}" path should be a string. A path that starts with a placeholder must be quoted in YAML, like path: '{space}/tickets/{ticket_id}'.`,
      { received: page.path, configKey }
    );
  }
  let segments;
  try {
    segments = parsePathPattern(page.path);
  } catch (error) {
    throw new ConfigError(`Page "${page.id}": ${error.message}`, { configKey });
  }
  return { pageId: page.id, path: page.path, segments, configKey };
}

export default parsePageRoute;
