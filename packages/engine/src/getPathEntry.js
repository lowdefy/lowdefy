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

import { pageInstanceKey } from '@lowdefy/helpers';

import pickPathParams from './pickPathParams.js';

// What the path memory holds for a page path: the page, the values its URL carries and the instance
// they open. `pattern` is the page's `path` config, undefined for a page served at its id.
function getPathEntry({ pageId, pathParams, pattern }) {
  return {
    pageId,
    pathParams: pickPathParams({ path: pattern, pathParams }),
    instanceKey: pageInstanceKey({ pageId, path: pattern, pathParams }),
  };
}

export default getPathEntry;
