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

import { getOperatorType, type } from '@lowdefy/helpers';

import checkValue from './checkValue.js';
import isUnderState from './isUnderState.js';

function isLiteralObject(value) {
  return type.isObject(value) && getOperatorType(value) === null;
}

function literalParamsError({ path, action, policy }) {
  return {
    path,
    rule: 'policy.literal',
    message: `${action} params must be literal under dynamic policy "${policy.id}", so the policy can see their target.`,
  };
}

function checkLink({ params, path, policy, errors }) {
  if (type.isString(params)) {
    // The string form is the pageId shorthand (actions-core Link).
    if (!policy.links.pages.includes(params)) {
      errors.push({
        path,
        rule: 'policy.links',
        message: `Page "${params}" is not in dynamic policy "${policy.id}" links.pages.`,
      });
    }
    return;
  }
  if (!isLiteralObject(params)) {
    errors.push(literalParamsError({ path, action: 'Link', policy }));
    return;
  }
  if (getOperatorType(params.home) !== null) {
    errors.push(literalParamsError({ path: `${path}.home`, action: 'Link', policy }));
  }
}

function checkCallApi({ params, path, policy, errors }) {
  if (!isLiteralObject(params) || !type.isString(params.endpointId)) {
    errors.push(literalParamsError({ path, action: 'CallAPI', policy }));
    return;
  }
  if (!policy.endpoints.includes(params.endpointId)) {
    errors.push({
      path: `${path}.endpointId`,
      rule: 'policy.endpoints',
      message: `Endpoint "${params.endpointId}" is not in dynamic policy "${policy.id}" endpoints.`,
    });
  }
}

// Request params take the forms engine/src/Requests.js reads, except { all },
// which would call every request on the page.
function getRequestIds(params) {
  if (type.isString(params)) return [params];
  if (type.isArray(params)) return params;
  if (isLiteralObject(params) && type.isString(params.requestId)) return [params.requestId];
  if (isLiteralObject(params) && type.isArray(params.requestIds)) return params.requestIds;
  return null;
}

function checkRequest({ params, path, policy, errors }) {
  const requestIds = getRequestIds(params);
  if (requestIds === null || !requestIds.every((requestId) => type.isString(requestId))) {
    errors.push({
      path,
      rule: 'policy.requests',
      message: `Request params must be literal request ids under dynamic policy "${policy.id}". "all" is not allowed.`,
    });
    return;
  }
  requestIds.forEach((requestId) => {
    if (!policy.requests.includes(requestId)) {
      errors.push({
        path,
        rule: 'policy.requests',
        message: `Request "${requestId}" is not in dynamic policy "${policy.id}" requests.`,
      });
    }
  });
}

function checkSetState({ params, path, policy, errors }) {
  if (!isLiteralObject(params)) {
    errors.push(literalParamsError({ path, action: 'SetState', policy }));
    return;
  }
  if (type.isNone(policy.state)) {
    return;
  }
  Object.keys(params).forEach((key) => {
    if (key.startsWith('~')) return;
    if (!isUnderState({ key, state: policy.state })) {
      errors.push({
        path: `${path}.${key}`,
        rule: 'policy.state',
        message: `SetState key "${key}" is outside "${policy.state}", the state dynamic policy "${policy.id}" allows.`,
      });
    }
  });
}

const ACTION_RULES = {
  CallAPI: checkCallApi,
  Link: checkLink,
  Request: checkRequest,
  SetState: checkSetState,
};

function checkAction({ action, path, walk }) {
  const { errors, policy } = walk;
  if (!isLiteralObject(action) || !type.isString(action.id) || !type.isString(action.type)) {
    errors.push({
      path,
      rule: 'policy.structure',
      message: 'Actions must be objects with a literal string "id" and "type".',
    });
    return;
  }
  if (walk.actionIds.has(action.id)) {
    errors.push({
      path: `${path}.id`,
      rule: 'policy.structure',
      message: `Action id "${action.id}" is used more than once in this event.`,
    });
  }
  walk.actionIds.add(action.id);
  if (!policy.actions.includes(action.type)) {
    errors.push({
      path: `${path}.type`,
      rule: 'policy.actions',
      message: `Action type "${action.type}" is not in dynamic policy "${policy.id}" actions.`,
    });
  }
  ACTION_RULES[action.type]?.({ params: action.params, path: `${path}.params`, policy, errors });
  checkValue({ value: action, path, policy, errors });
}

export default checkAction;
