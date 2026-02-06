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

import { deserializeError } from '@lowdefy/errors/client';

async function request({ url, method = 'GET', body }) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    if (errorBody['~err']) {
      const error = deserializeError(errorBody);
      if (errorBody.additionalErrors?.length > 0) {
        error.additionalErrors = errorBody.additionalErrors.map((e) =>
          e['~err'] ? deserializeError(e) : new Error(e.message)
        );
      }
      throw error;
    }
    throw new Error(errorBody.message || 'Request error');
  }
  return res.json();
}

export default request;
