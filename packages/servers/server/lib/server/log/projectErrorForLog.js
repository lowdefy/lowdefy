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

import { lowdefyErrorNames, readErrorCodes } from '@lowdefy/errors';

// Kept only on nodes named as a Lowdefy error class: libraries reuse some of
// these names for their own data - axios's `config` carries auth, params and
// headers - so keying on the field alone would let a library's copy through.
// `received` is not among them: it holds an operator's or control's evaluated
// input - a user's ID number, a token from an earlier step - and the log names
// where a fault happened, not the values it ran on. The dev server's log keeps it.
const lowdefyErrorFields = [
  'configKey',
  'source',
  'config',
  'handled',
  'isLowdefyError',
  'typeName',
  'location',
  'service',
  'hint',
  'retryAfter',
  'methodName',
  'metaData',
  'blockId',
  'pageId',
  'isReject',
  'collection',
  'connectionId',
  'organizationId',
  'field',
  'endpointId',
  // A failed request's step id (callRequestResolver), beside its endpointId and connectionId,
  // so its error log names the step rather than its inputs.
  'stepId',
];

function projectErrorForLog(err) {
  const { code, statusCode } = readErrorCodes(err);
  const props = { name: err.name, message: err.message, stack: err.stack, code, statusCode };
  if (lowdefyErrorNames.has(err.name)) {
    lowdefyErrorFields.forEach((field) => {
      props[field] = err[field];
    });
  }
  props.cause = err.cause;
  return props;
}

export default projectErrorForLog;
