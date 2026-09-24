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

import { type } from '@lowdefy/helpers';
import { getFromObject } from '@lowdefy/operators';

// The same operator on server and client: the routine or event runner puts the error a server
// `:catch` or a client `catch` list caught into scope. Outside a catch there is no error, and
// every read resolves to null or its default, the way `_item` does outside a :for.
function _error({ arrayIndices, error, location, params }) {
  // The whole error is returned as is, not through getFromObject: its `all` branch copies the
  // value through the serializer, which revives the Error with an enumerable message, so the
  // message would then travel in any plugin payload the error is placed in. Returning the Error
  // itself also keeps the wire policy on it wherever it is sent.
  if (params === true || (type.isObject(params) && params.all === true)) {
    return error ?? null;
  }
  return getFromObject({
    arrayIndices,
    location,
    object: error ?? {},
    operator: '_error',
    params,
  });
}

_error.dynamic = true;
// Reads only the caught error of its own parse frame, which no update changes.
_error.tracking = { kind: 'pure' };

export default _error;
