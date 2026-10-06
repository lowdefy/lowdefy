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

// The placeholders of a route that pathParams gives no value for: missing,
// null or an empty string.
function findMissingPathParams({ route, pathParams }) {
  return route.segments
    .filter((segment) => type.isString(segment.name))
    .map((segment) => segment.name)
    .filter((name) => {
      const value = type.isObject(pathParams) ? pathParams[name] : undefined;
      return type.isNone(value) || value === '';
    });
}

export default findMissingPathParams;
