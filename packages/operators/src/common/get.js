/*
  Copyright 2020 Lowdefy, Inc

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

import { applyArrayIndices, get, type } from '@lowdefy/helpers';

function _get({ params, location, arrayIndices }) {
  if (!type.isObject(params)) {
    throw new Error(
      `Operator Error: _get takes an object as params. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }

  if (!type.isString(params.key)) {
    throw new Error(
      `Operator Error: _get.key takes a string. Received ${JSON.stringify(params)} at ${location}.`
    );
  }
  if (!type.isObject(params.from) && !type.isArray(params.from)) {
    return null;
  }
  return get(params.from, applyArrayIndices(arrayIndices, params.key), {
    default: get(params, 'default', { default: null }),
  });
}

export default _get;
