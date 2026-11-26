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

// The tokens of a block's class, or of one of its keys: a string, an array or an object of them,
// as the web client's cn() reads it.
function collectClassTokens(value) {
  if (type.isString(value)) return value.split(/\s+/);
  if (type.isArray(value)) return value.flatMap(collectClassTokens);
  if (type.isObject(value)) return Object.values(value).flatMap(collectClassTokens);
  return [];
}

export default collectClassTokens;
