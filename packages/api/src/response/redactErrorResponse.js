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

import createWireProjection from './createWireProjection.js';
import normalizeErrorSources from './normalizeErrorSources.js';

// The one error payload every route and transport sends for a thrown error, at
// any status. Owning the serialization as well as the policy leaves no bare
// serializer.serialize(error) in response position for a caller to forget.
//
// `~e` is the wire error - identical in dev and prod, because it is what app
// config reads. In dev the payload also carries `devError`, the error as the dev
// terminal logs it, for the dev tools. It sits beside `~e` rather than inside it:
// the serializer's reviver replaces any object holding `~e` with its error, so a
// plain deserialize of the payload drops `devError` and config never sees it.
function redactErrorResponse(context, error) {
  // Endpoint routes serialize the error field on success too, where it is null.
  // Passing that through unchanged keeps them from emitting an empty {'~e'}.
  if (type.isNone(error)) return error;
  const payload = serializer.serialize(error, {
    projectError: createWireProjection(context),
  });
  // The server error handler has no request context when it fails before the
  // context middleware runs, so there is no mode to read and no devError.
  if (context?.mode === 'dev') {
    const full = serializer.serialize(error);
    payload.devError = normalizeErrorSources(context, {
      '~e': { ...full['~e'], requestId: context.rid },
    });
  }
  return payload;
}

export default redactErrorResponse;
