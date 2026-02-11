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

import { get, type } from '@lowdefy/helpers';
import { getFromObject } from '@lowdefy/operators';

function _get({ arrayIndices, location, params }) {
  if (!type.isObject(params)) {
    throw new Error(`_get takes an object as params.`);
  }

  if (params.from === null) return get(params, 'default', { default: null, copy: true });

  if (!type.isObject(params.from) && !type.isArray(params.from)) {
    throw new Error(`_get.from is not an object or array.`);
  }
  return getFromObject({
    arrayIndices,
    location,
    object: params.from,
    operator: '_get',
    params,
  });
}

_get.dynamic = false;

export default _get;
