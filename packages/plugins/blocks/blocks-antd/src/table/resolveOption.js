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

import getOptionsMap from './getOptionsMap.js';

// The option for a cell value, or undefined. A number or boolean value also
// matches an option keyed by its string form, because options given as a map
// always have string keys.
function resolveOption({ options, value }) {
  if (type.isNone(value) || !type.isPrimitive(value)) return undefined;
  const map = getOptionsMap(options);
  return map.get(value) ?? map.get(String(value));
}

export default resolveOption;
