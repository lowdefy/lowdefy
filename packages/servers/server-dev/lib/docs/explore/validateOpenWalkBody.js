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

import { isTraceId, type } from '@lowdefy/helpers';

// The open route's JSON body, checked before anything opens:
// { pageId, pathParams?, urlQuery?, user?, data?, liveData?, allowExternal?, run, walk,
// record, roles?, roleMatrixListed? }. run is the explorer run's trace id and walk the walk's name in
// it (the recording cookie's run.id and run.journey). Returns an error
// message, or undefined when the body is valid.
function validateOpenWalkBody(body) {
  if (!type.isObject(body)) {
    return `The walk route expects a JSON object body. Received ${JSON.stringify(body)}.`;
  }
  const { pageId, pathParams, urlQuery, user, data, liveData, allowExternal, run, walk, record } =
    body;
  const { roles, roleMatrixListed } = body;
  if (!type.isString(pageId) || pageId === '') {
    return `The walk's "pageId" must be a page id string. Received ${JSON.stringify(pageId)}.`;
  }
  if (!isTraceId(run)) {
    return `The walk's "run" must be a trace id like "20261003T151200Z-p0d4rm". Received ${JSON.stringify(
      run
    )}.`;
  }
  if (!type.isString(walk) || walk === '') {
    return `The walk's "walk" must be a non-empty string naming the walk in its run. Received ${JSON.stringify(
      walk
    )}.`;
  }
  if (!type.isBoolean(record)) {
    return `The walk's "record" must be true or false. Received ${JSON.stringify(record)}.`;
  }
  if (!type.isNone(pathParams) && !type.isObject(pathParams)) {
    return `The walk's "pathParams" must be an object of path values. Received ${JSON.stringify(
      pathParams
    )}.`;
  }
  if (!type.isNone(urlQuery) && !type.isObject(urlQuery)) {
    return `The walk's "urlQuery" must be an object. Received ${JSON.stringify(urlQuery)}.`;
  }
  if (!type.isNone(user) && !type.isString(user) && !type.isObject(user)) {
    return `The walk's "user" must be a data set user name or a headless user object. Received ${JSON.stringify(
      user
    )}.`;
  }
  if (!type.isNone(data) && !type.isString(data)) {
    return `The walk's "data" must be a data set name string. Received ${JSON.stringify(data)}.`;
  }
  if (!type.isNone(liveData) && !type.isBoolean(liveData)) {
    return `The walk's "liveData" must be true or false. Received ${JSON.stringify(liveData)}.`;
  }
  if (
    !type.isNone(allowExternal) &&
    (!type.isArray(allowExternal) || !allowExternal.every((id) => type.isString(id)))
  ) {
    return `The walk's "allowExternal" must be an array of connection ids. Received ${JSON.stringify(
      allowExternal
    )}.`;
  }
  if (
    !type.isNone(roles) &&
    (!type.isArray(roles) || !roles.every((role) => type.isString(role)))
  ) {
    return `The walk's "roles" must be an array of role names. Received ${JSON.stringify(roles)}.`;
  }
  if (!type.isNone(roleMatrixListed) && !type.isBoolean(roleMatrixListed)) {
    return `The walk's "roleMatrixListed" must be true or false. Received ${JSON.stringify(
      roleMatrixListed
    )}.`;
  }
  return undefined;
}

export default validateOpenWalkBody;
