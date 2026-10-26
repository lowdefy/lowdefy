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
import { getPossibleOperators } from '@lowdefy/operators';

import checkValue from './checkValue.js';
import isUnderState from './isUnderState.js';

function isLiteralObject({ value, walk }) {
  return (
    type.isObject(value) &&
    getPossibleOperators({ value, operators: walk.clientOperators }).length === 0
  );
}

function literalParamsError({ path, action, policy }) {
  return {
    path,
    rule: 'policy.literal',
    message: `${action} params must be literal under dynamic blocks policy "${policy.id}", so the policy can see their target.`,
  };
}

function checkLink({ params, path, walk }) {
  const { errors, policy } = walk;
  if (type.isString(params)) {
    // The string form is the pageId shorthand (actions-core Link).
    if (!policy.links.pages.includes(params)) {
      errors.push({
        path,
        rule: 'policy.links',
        message: `Page "${params}" is not in dynamic blocks policy "${policy.id}" links.pages.`,
      });
    }
    return;
  }
  if (!isLiteralObject({ value: params, walk })) {
    errors.push(literalParamsError({ path, action: 'Link', policy }));
    return;
  }
  if (getPossibleOperators({ value: params.home, operators: walk.clientOperators }).length > 0) {
    errors.push(literalParamsError({ path: `${path}.home`, action: 'Link', policy }));
  }
}

function checkCallApi({ params, path, walk }) {
  const { errors, policy } = walk;
  if (!isLiteralObject({ value: params, walk }) || !type.isString(params.endpointId)) {
    errors.push(literalParamsError({ path, action: 'CallAPI', policy }));
    return;
  }
  if (!policy.endpoints.includes(params.endpointId)) {
    errors.push({
      path: `${path}.endpointId`,
      rule: 'policy.endpoints',
      message: `Endpoint "${params.endpointId}" is not in dynamic blocks policy "${policy.id}" endpoints.`,
    });
  }
}

// Request params take the forms engine/src/Requests.js reads, except { all },
// which would call every request on the page.
function getRequestIds({ params, walk }) {
  if (type.isString(params)) return [params];
  if (type.isArray(params)) return params;
  const literal = isLiteralObject({ value: params, walk });
  if (literal && type.isString(params.requestId)) return [params.requestId];
  if (literal && type.isArray(params.requestIds)) return params.requestIds;
  return null;
}

function checkRequest({ params, path, walk }) {
  const { errors, policy } = walk;
  const requestIds = getRequestIds({ params, walk });
  if (requestIds === null || !requestIds.every((requestId) => type.isString(requestId))) {
    errors.push({
      path,
      rule: 'policy.requests',
      message: `Request params must be literal request ids under dynamic blocks policy "${policy.id}". "all" is not allowed.`,
    });
    return;
  }
  requestIds.forEach((requestId) => {
    if (!policy.requests.includes(requestId)) {
      errors.push({
        path,
        rule: 'policy.requests',
        message: `Request "${requestId}" is not in dynamic blocks policy "${policy.id}" requests.`,
      });
    }
  });
}

function checkSetState({ params, path, walk }) {
  const { errors, policy } = walk;
  if (!isLiteralObject({ value: params, walk })) {
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
        message: `SetState key "${key}" is outside "${policy.state}", the state dynamic blocks policy "${policy.id}" allows.`,
      });
    }
  });
}

// Whether two state paths name the same value or one holds the other. A "$"
// segment (an id inside a list) matches any segment.
function overlapsStatePath({ key, id }) {
  const keyParts = key.split('.');
  const idParts = id.split('.');
  const length = Math.min(keyParts.length, idParts.length);
  for (let index = 0; index < length; index += 1) {
    const keyPart = keyParts[index];
    const idPart = idParts[index];
    if (keyPart !== idPart && keyPart !== '$' && idPart !== '$') return false;
  }
  return true;
}

// SetState values are state: the content stores them and never draws or follows
// them itself (block properties must be literal, so no block reads them back),
// so they are data, judged only by the operator rules. A value bound to a
// content input whose value is an object (walk.objectValueIds: a rich text
// editor, an upload, a table input) is drawn by it as markup, links or images,
// so it keeps every check. checkSetState has judged the keys.
function checkSetStateValues({ action, path, walk }) {
  const { params, ...rest } = action;
  checkValue({ value: rest, path, walk });
  Object.keys(params).forEach((key) => {
    if (key.startsWith('~')) return;
    const drawn = walk.objectValueIds.some((id) => overlapsStatePath({ key, id }));
    checkValue({
      value: params[key],
      key,
      path: `${path}.params.${key}`,
      walk: drawn ? walk : { ...walk, isData: true },
    });
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
  if (
    !isLiteralObject({ value: action, walk }) ||
    !type.isString(action.id) ||
    !type.isString(action.type)
  ) {
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
      message: `Action type "${action.type}" is not in dynamic blocks policy "${policy.id}" actions.`,
    });
  }
  ACTION_RULES[action.type]?.({ params: action.params, path: `${path}.params`, walk });
  if (action.type === 'SetState' && isLiteralObject({ value: action.params, walk })) {
    checkSetStateValues({ action, path, walk });
    return;
  }
  checkValue({ value: action, path, walk });
}

export default checkAction;
