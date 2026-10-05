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

// The values a page's URL carries: one string per placeholder in its pattern, as the server
// returns them for a matched path. Keys the pattern does not use are dropped.
function pickPathParams({ path, pathParams }) {
  if (type.isUndefined(path)) {
    return {};
  }
  const values = {};
  parsePathPattern(path).forEach((segment) => {
    if (type.isString(segment.name)) {
      values[segment.name] = String(pathParams[segment.name]);
    }
  });
  return values;
}

export default pickPathParams;
