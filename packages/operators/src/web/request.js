/*
  Copyright 2020-2021 Lowdefy, Inc

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
  if (requestId in requests && !requests[requestId].loading) {
    if (splitKey.length === 1) {
      return serializer.copy(requests[requestId].response);
    }
    const key = keyParts.reduce((acc, value) => (acc === '' ? value : acc.concat('.', value)), '');
    return get(requests[requestId].response, applyArrayIndices(arrayIndices, key), {
      copy: true,
    });
  }
  return null;
}

export default _request;
