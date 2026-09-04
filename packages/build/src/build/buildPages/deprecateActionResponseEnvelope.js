/* eslint-disable no-param-reassign */

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

import { ConfigWarning } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import extractOperatorPath from '../../utils/extractOperatorPath.js';
import traverseConfig from '../../utils/traverseConfig.js';

// Until v8 a CallAPI action returned the engine's api record, whose own
// `response` field held the endpoint's :return value, so the result was read at
// `_actions.<id>.response.response.<path>`. The action now returns the :return
// value itself (callAPIHandler), so the result is at
// `_actions.<id>.response.<path>` and the record's other fields are read
// through `_api.<endpointId>`. The old spelling is rewritten with a warning for
// one release and is removed in v9.
//
// Only reads addressed at a CallAPI action on the same page are rewritten: for
// any other action `.response.response` is an ordinary read of a `response` key
// in the action's own result.
function deprecateActionResponseEnvelope({ page, context }) {
  const callApiActionIds = new Set();
  const actionRefs = [];
  traverseConfig({
    config: page,
    visitor: (obj) => {
      if (obj.type === 'CallAPI' && type.isString(obj.id)) {
        callApiActionIds.add(obj.id);
      }
      if (!type.isUndefined(obj._actions)) {
        actionRefs.push(obj);
      }
    },
  });
  if (callApiActionIds.size === 0) return;

  actionRefs.forEach((obj) => {
    const path = extractOperatorPath({ operatorValue: obj._actions });
    if (path === null) return;
    const segments = path.split('.');
    const [actionId, record, envelope] = segments;
    if (!callApiActionIds.has(actionId)) return;
    if (record !== 'response' || envelope !== 'response') return;

    const rewritten = [actionId, 'response', ...segments.slice(3)].join('.');
    if (type.isString(obj._actions)) {
      obj._actions = rewritten;
    } else if (type.isString(obj._actions.key)) {
      obj._actions.key = rewritten;
    } else {
      obj._actions.path = rewritten;
    }
    context.handleWarning(
      new ConfigWarning(
        `_actions "${path}" reads the removed double "response" envelope of CallAPI action "${actionId}". It was read as "${rewritten}" - write that instead. The api record fields (status, success, responseTime) are read with _api.`,
        { configKey: obj['~k'], checkSlug: 'actions-response-envelope' }
      )
    );
  });
}

export default deprecateActionResponseEnvelope;
