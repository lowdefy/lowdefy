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

import { get, serializer, type } from '@lowdefy/helpers';

function _api({ params, apiResponses, location }) {
  console.log('_api', { params, apiResponses, location });
  if (!type.isString(params)) {
    throw new Error(
      `Operator Error: _api accepts a string value. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }

  const splitKey = params.split('.');
  const [endpoint, ...keyParts] = splitKey;

  if (endpoint in apiResponses && !apiResponses[endpoint][0].loading) {
    const success = apiResponses[endpoint][0].success;
    const baseKey = success ? 'response' : 'error';

    if (splitKey.length === 1) {
      return serializer.copy(apiResponses[endpoint][0][baseKey]);
    }

    const key = keyParts.join('.');
    return get(apiResponses[endpoint][0][baseKey], key, {
      copy: true,
      default: null,
    });
  }

  return null;
}

export default _api;
