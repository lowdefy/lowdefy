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

import { applyArrayIndices, get, serializer, type } from '@lowdefy/helpers';

function _request({ arrayIndices, params, requests, location }) {
  if (!type.isString(params)) {
    throw new Error(
      `Operator Error: _request accepts a string value. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  const splitKey = params.split('.');
  const [requestId, ...keyParts] = splitKey;
  if (requestId in requests && !requests[requestId][0].loading) {
    if (splitKey.length === 1) {
      return serializer.copy(requests[requestId][0].response);
    }
    const key = keyParts.reduce((acc, value) => (acc === '' ? value : acc.concat('.', value)), '');
    return get(requests[requestId][0].response, applyArrayIndices(arrayIndices, key), {
      copy: true,
      default: null,
    });
  }
  return null;
}

export default _request;
