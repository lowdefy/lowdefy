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

function _path_params({ arrayIndices, location, params, pathParams }) {
  return getFromObject({
    arrayIndices,
    location,
    object: pathParams,
    operator: '_path_params',
    params,
  });
}

_path_params.dynamic = true;
// A page instance's path values are fixed for the instance's context: a different value is a
// different instance.
_path_params.tracking = { kind: 'pure' };

export default _path_params;
