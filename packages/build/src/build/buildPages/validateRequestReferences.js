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

function validateRequestReferences({ requestActionRefs, requests, pageId, context }) {
  const requestIds = new Set(requests.map((req) => req.requestId));

  requestActionRefs.forEach(({ requestId, action }) => {
    // Skip validation if action has skip condition (true or operator object)
    if (action.skip === true || type.isObject(action.skip)) {
      return;
    }

    if (!requestIds.has(requestId)) {
      context.handleWarning({
        message: `Request "${requestId}" not defined on page "${pageId}".`,
        configKey: action['~k'],
        prodError: true,
        checkSlug: 'request-refs',
      });
    }
  });
}

export default validateRequestReferences;
