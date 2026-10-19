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

// The docs routes take a page instance's path values as a JSON string on the
// GET routes (query params are always strings) and as an object in the POST
// bodies. Returns { pathParams } or { error }; the page tools check the values
// against the page's pattern.
function parsePathParamsParam({ value }) {
  if (type.isNone(value)) {
    return {};
  }
  if (!type.isString(value)) {
    return { pathParams: value };
  }
  try {
    return { pathParams: JSON.parse(value) };
  } catch {
    return {
      error: `The "pathParams" param must be JSON, e.g. {"ticket_id":"1"}. Received ${JSON.stringify(
        value
      )}.`,
    };
  }
}

export default parsePathParamsParam;
