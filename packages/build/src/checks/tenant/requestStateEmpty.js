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
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../../utils/collectExceptions.js';
import findCallerReferences from './findCallerReferences.js';

// A page request is evaluated on the server with `state` hardcoded to `{}`
// (api callRequest.js), so `_state` in its properties always evaluates to
// undefined: a filter that silently matches everything, or a document with a
// missing field. It is a silent-failure bug on every page request, walled or
// not, which is why it walks every built page rather than the tenant site
// list, and why it is reported as its own finding and not as a tenant leak -
// the caller can not steer a value that does not exist.
function run({ components, context }) {
  (components.pages ?? []).forEach((page) => {
    (page.requests ?? []).forEach((request) => {
      const state = findCallerReferences(request.properties).find(
        (reference) => reference.operator === '_state'
      );
      if (!state) return;
      collectExceptions(
        context,
        new ConfigError(
          `Request "${request.requestId}" at page "${page.pageId}" reads "_state" in its request properties. _state is always empty in a request — a request is evaluated on the server with an empty state, so this value is undefined. Pass the value in the request payload and read it with _payload.`,
          { configKey: request['~k'], checkSlug: 'request-state-empty' }
        )
      );
    });
  });
}

const requestStateEmpty = {
  slug: 'request-state-empty',
  checkOnly: true,
  run,
};

export default requestStateEmpty;
