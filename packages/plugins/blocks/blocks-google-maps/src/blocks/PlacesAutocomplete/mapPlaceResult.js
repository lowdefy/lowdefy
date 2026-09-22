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

import { set, type } from '@lowdefy/helpers';

// Place fields come back camelCased, mapping renames them onto the keys the app
// stores. A mapped key may be a dotted path, which nests the value.
function mapPlaceResult({ mapping, result }) {
  if (type.isNone(mapping)) return result;
  const mapped = {};
  Object.entries(result).forEach(([key, value]) => {
    set(mapped, mapping[key] ?? key, value);
  });
  return mapped;
}

export default mapPlaceResult;
