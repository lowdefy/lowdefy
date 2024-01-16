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

function _regex({ location, params, state }) {
  const pattern = type.isObject(params) ? params.pattern : params;
  if (!type.isString(pattern)) {
    throw new Error(
      `Operator Error: _regex.pattern must be a string. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  let on = !type.isUndefined(params.on) ? params.on : get(state, location);
  if (!type.isUndefined(params.key)) {
    if (!type.isString(params.key)) {
      throw new Error(
        `Operator Error: _regex.key must be a string. Received: ${JSON.stringify(
          params
        )} at ${location}.`
      );
    }
    on = get(state, params.key);
  }

  if (type.isNone(on)) {
    return false;
  }
  if (!type.isString(on)) {
    throw new Error(
      `Operator Error: _regex.on must be a string. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  try {
    const re = new RegExp(pattern, params.flags || 'gm');
    return re.test(on);
  } catch (e) {
    // log e to LowdefyError
    throw new Error(
      `Operator Error: _regex failed to execute RegExp.test. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
}

export default _regex;
