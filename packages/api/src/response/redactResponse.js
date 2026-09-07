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

import { serializer } from '@lowdefy/helpers';

import normalizeErrorSources from './normalizeErrorSources.js';
import omitErrorProps from './omitErrorProps.js';

// The response-value call shape, beside redactErrorResponse's error-only one.
// A response is not an error, but makeReplacer wraps any Error it meets anywhere
// in a value, so a response holding one is an error-serialization site too - the
// grep that enumerated those sites could not see them, which is why this exists
// as a function rather than as a rule to remember.
//
// Same policy as the error field, because it reaches the same audience: a browser
// for a request or endpoint body, a third party for cron and detached.
function redactResponse(context, response) {
  return normalizeErrorSources(context, serializer.serialize(response, { omitErrorProps }));
}

export default redactResponse;
