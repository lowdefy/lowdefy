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

import { decodeServerError } from '@lowdefy/engine';
import { expectedErrorNames, lowdefyErrorTypes } from '@lowdefy/errors';
import { translate } from '@lowdefy/helpers';

async function request({ url, method = 'GET', body }) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const body = await res.json();
    if (body?.['~e']) {
      throw decodeServerError(body);
    }
    // The server answers an expected outcome (an auth gate's 401 or 403, a
    // UserError's 400) itself, as { name, message } with no serialized error.
    // Rebuilding its class keeps the name the engine, handleError and the dev
    // tools tell an expected outcome from a fault by.
    if (expectedErrorNames.has(body?.name)) {
      const ExpectedError = lowdefyErrorTypes[body.name];
      throw new ExpectedError(body.message);
    }
    throw new Error(body.message || translate({ key: 'client.requestError' }));
  }
  return res.json();
}

export default request;
