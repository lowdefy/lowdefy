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

// A runtime operator survives the build as an object with a single key that
// starts with "_". Build operators are folded away by precompute before checks
// run, so anything still shaped like this is evaluated per render and no
// static rewrite of it is possible.
function isOperatorValue(value) {
  if (!type.isObject(value)) return false;
  const keys = Object.keys(value).filter((key) => !key.startsWith('~'));
  return keys.length === 1 && keys[0].startsWith('_');
}

export default isOperatorValue;
