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

import { getFromObject } from '@lowdefy/operators';

// Reads a value from the enclosing component instance's resolved props. The
// props scope is threaded through the parser the way arrayIndices is (see the
// components sub-design). Outside a component instance props is undefined and
// getFromObject returns undefined for any key.
function _prop({ arrayIndices, location, params, props }) {
  return getFromObject({
    arrayIndices,
    location,
    object: props,
    operator: '_prop',
    params,
  });
}

_prop.dynamic = true;

export default _prop;
