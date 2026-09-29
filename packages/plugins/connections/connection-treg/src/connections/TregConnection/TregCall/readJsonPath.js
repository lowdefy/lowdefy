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

// A dotted path into a JSON document, as treg's async descriptors write them
// ("task.status", "data.0.url").
function readJsonPath(document, path) {
  if (!type.isString(path) || path === '') return undefined;
  return path.split('.').reduce((current, part) => {
    if (type.isObject(current)) return current[part];
    if (type.isArray(current) && /^[0-9]+$/.test(part)) return current[Number(part)];
    return undefined;
  }, document);
}

export default readJsonPath;
