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

import { applyArrayIndices, get, ReservedKeyError, type } from '@lowdefy/helpers';

// The values a _get or _args read can have copied (getFromObject): the value at
// its key, or the whole object with all, and its default.
function findCopySources({ op, params, args, arrayIndices }) {
  const object = op === '_get' ? params?.from : args;
  let read = params;
  if (read === true) {
    read = { all: true };
  }
  if (type.isString(read) || type.isInt(read)) {
    read = { key: read };
  }
  if (!type.isObject(read)) {
    return [];
  }
  const sources = [read.default];
  if (read.all === true) {
    return [...sources, object];
  }
  if (!type.isString(read.key) && !type.isInt(read.key)) {
    return sources;
  }
  try {
    return [...sources, get(object, applyArrayIndices(arrayIndices, read.key))];
  } catch (error) {
    // The read returned its default for a reserved key.
    if (error instanceof ReservedKeyError) {
      return sources;
    }
    throw error;
  }
}

export default findCopySources;
