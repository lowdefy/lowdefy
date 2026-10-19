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

import { UserError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// The Lowdefy client posts a JSON object ({ blockId, pageId, payload }). A body
// that is not one is the caller's mistake: a UserError, which the servers answer
// with 400 and log as a warning, not a 500 logged as a fault.
function parseRequestBody({ text }) {
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new UserError('Request body is not valid JSON.');
  }
  if (!type.isObject(body)) {
    throw new UserError('Request body must be a JSON object.');
  }
  return body;
}

export default parseRequestBody;
