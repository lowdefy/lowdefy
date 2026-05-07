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
import { getFromObject } from '@lowdefy/operators';

const roleMethods = ['hasRole', 'hasSomeRoles', 'hasAllRoles'];

function getUserRoles({ user, methodName }) {
  const roles = user?.roles;
  if (type.isNone(roles)) return [];
  if (!type.isArray(roles)) {
    throw new Error(
      `_user.${methodName} expects "user.roles" to be an array of strings. Received ${JSON.stringify(
        roles
      )}.`
    );
  }
  return roles;
}

function validateRoleString({ params, methodName }) {
  if (!type.isString(params)) {
    throw new Error(`_user.${methodName} accepts a string. Received ${JSON.stringify(params)}.`);
  }
  return params;
}

function validateRoleArray({ params, methodName }) {
  if (!type.isArray(params) || !params.every((role) => type.isString(role))) {
    throw new Error(
      `_user.${methodName} accepts an array of strings. Received ${JSON.stringify(params)}.`
    );
  }
  return params;
}

function _user({ arrayIndices, location, methodName, params, user }) {
  if (methodName === 'hasRole') {
    const role = validateRoleString({ params, methodName });
    const userRoles = getUserRoles({ user, methodName });
    return userRoles.includes(role);
  }
  if (methodName === 'hasSomeRoles') {
    const required = validateRoleArray({ params, methodName });
    const userRoles = getUserRoles({ user, methodName });
    return required.some((role) => userRoles.includes(role));
  }
  if (methodName === 'hasAllRoles') {
    const required = validateRoleArray({ params, methodName });
    const userRoles = getUserRoles({ user, methodName });
    return required.every((role) => userRoles.includes(role));
  }
  if (!type.isUndefined(methodName)) {
    throw new Error(
      `_user.${methodName} is not supported, use one of the following: ${roleMethods.join(', ')}.`
    );
  }
  return getFromObject({
    arrayIndices,
    location,
    object: user,
    operator: '_user',
    params,
  });
}

_user.dynamic = true;

export default _user;
