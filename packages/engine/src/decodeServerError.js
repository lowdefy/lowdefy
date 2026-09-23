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

import { serializer, type } from '@lowdefy/helpers';

// The decoded error is stored as `request.error` / `api.error` and rethrown,
// and config reads it through `_actions`, `_request_details` and `_error`. Any
// property on it - enumerable or not - is one operator change away from config,
// so the dev server's full error is kept beside it here, keyed by the error
// itself, where only the dev tools look.
const devErrors = new WeakMap();

function decodeServerError(payload) {
  if (type.isNone(payload)) return payload;
  const { devError, ...rest } = payload;
  const error = serializer.deserialize(rest);
  if (!type.isNone(devError)) {
    devErrors.set(error, serializer.deserialize(devError));
  }
  return error;
}

function getDevError(error) {
  return devErrors.get(error);
}

export { getDevError };

export default decodeServerError;
