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
import { ConfigError, resolveConfigLocation } from '@lowdefy/errors';

import collectExceptions from '../../utils/collectExceptions.js';

// Two routes tie when they have the same number of segments, placeholders in
// the same positions and fixed segments equal ignoring case. "{}" cannot be a
// fixed segment, so it stands for any placeholder.
function routeShape({ route }) {
  return route.segments
    .map((segment) => (type.isString(segment.fixed) ? segment.fixed.toLowerCase() : '{}'))
    .join('/');
}

function checkRouteTies({ routes, context }) {
  const routesByShape = new Map();
  for (const route of routes) {
    const shape = routeShape({ route });
    const earlier = routesByShape.get(shape);
    if (type.isUndefined(earlier)) {
      routesByShape.set(shape, route);
      continue;
    }
    // Two pages with the same id are refused by the duplicate page id check.
    if (earlier.pageId.toLowerCase() === route.pageId.toLowerCase()) {
      continue;
    }
    const location = resolveConfigLocation({
      configKey: earlier.configKey,
      keyMap: context.keyMap,
      refMap: context.refMap,
      configDirectory: context.directories?.config,
    });
    const earlierAt = type.isNone(location)
      ? ''
      : ` Page "${earlier.pageId}" is at ${location.source}.`;
    collectExceptions(
      context,
      new ConfigError(
        `Pages "${earlier.pageId}" and "${route.pageId}" match the same URLs, with paths "${earlier.path}" and "${route.path}". Paths tie when they have the same segments, placeholders in the same positions and fixed segments equal ignoring case. Change one of the paths.${earlierAt}`,
        { configKey: route.configKey }
      )
    );
  }
}

export default checkRouteTies;
