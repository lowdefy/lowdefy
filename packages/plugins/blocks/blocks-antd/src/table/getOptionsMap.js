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

// Cells look options up once per cell, so each normalised options array gets
// one Map, built the first time it is asked for and kept as long as the array.
const maps = new WeakMap();

// A Map from option value to option, with the option's position as `index`
// (the order tags and statuses sort in). Earlier options win on duplicates.
function getOptionsMap(options) {
  if (!type.isArray(options)) return new Map();
  let map = maps.get(options);
  if (map) return map;
  map = new Map();
  options.forEach((option, index) => {
    if (!map.has(option.value)) {
      map.set(option.value, { ...option, index });
    }
  });
  maps.set(options, map);
  return map;
}

export default getOptionsMap;
