/*
  Copyright 2020-2024 Lowdefy, Inc

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

import setNonEnumerableProperty from '../../utils/setNonEnumerableProperty.js';

// Returns a serializer.copy reviver that sets ~r on all objects
// that don't already have it, preserving original file references.
function createRefReviver(refId) {
  return (_, value) => {
    if (!type.isObject(value) && !type.isArray(value)) return value;
    if (value['~r'] === undefined) {
      setNonEnumerableProperty(value, '~r', refId);
    }
    return value;
  };
}

export default createRefReviver;
