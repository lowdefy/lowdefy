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

// A selection option arrives as one value (a string from the MCP tool or
// `journeys harden --filter`) or as a list (a repeated `lowdefy test` flag).
function asList(value) {
  if (type.isNone(value)) {
    return [];
  }
  if (type.isArray(value)) {
    return value;
  }
  return [value];
}

export default asList;
