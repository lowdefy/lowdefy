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

import { buildPagePath, pageInstanceKey, type } from '@lowdefy/helpers';

import readPagePath from './readPagePath.js';

// The page instance a dev tool names by `pageId` and `pathParams`: the page's
// path pattern (readPagePath, undefined for a page the route table does not
// list) and the key its context and input are stored under. Returns
// { path, instanceKey }, or { error } for pathParams that are not an object or
// that miss a placeholder of the pattern, as data for the tool to return to the
// agent before it opens a browser.
function resolvePageInstance({ pageId, pathParams }) {
  if (!type.isNone(pathParams) && !type.isObject(pathParams)) {
    return {
      error: `"pathParams" must be an object of path values, e.g. {"ticket_id": "1"}. Received ${JSON.stringify(
        pathParams
      )}.`,
    };
  }
  const path = readPagePath({ pageId });
  try {
    buildPagePath({ pageId, path, pathParams });
  } catch (error) {
    return {
      error: `${error.message} Page "${pageId}" is served at "${path}": pass "pathParams" with a value for each placeholder.`,
    };
  }
  return { path, instanceKey: pageInstanceKey({ pageId, path, pathParams }) };
}

export default resolvePageInstance;
