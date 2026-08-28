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

import normalizeErrorSources from './normalizeErrorSources.js';
import omitErrorProps from './omitErrorProps.js';

// Owns the serialization as well as the policy, so the policy cannot be forgotten:
// no bare serializer.serialize(error) is left in response position to wrap. Every
// route returning an error to a caller - any status, any transport - goes through
// here or through buildEndpointResult.
function redactErrorResponse(context, error) {
  // Endpoint routes serialize the error field on success too, where it is null.
  // Passing that through unchanged keeps them from emitting an empty {'~e'}.
  if (type.isNone(error)) return error;
  return normalizeErrorSources(context, serializer.serialize(error, { omitErrorProps }));
}

export default redactErrorResponse;
