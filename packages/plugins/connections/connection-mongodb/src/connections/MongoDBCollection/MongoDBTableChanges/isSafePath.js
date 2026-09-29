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

// A dot path that MongoDB reads as plain field names: no empty segment and no segment that
// starts with "$", so a path can never be an operator ("$where"), a positional ("a.$" or
// "a.$[x]") or an array filter identifier of its own.
function isSafePath(path) {
  if (!type.isString(path) || path === '') return false;
  return path.split('.').every((segment) => segment !== '' && !segment.startsWith('$'));
}

export default isSafePath;
