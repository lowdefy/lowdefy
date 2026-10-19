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

// Records the page a followed link goes to, before the router pushes it, so the memory holds the
// paths this session navigated to and not every link it drew. A `url` target names no page and has
// no instance key; for an app path, the page response tells the memory instead.
function rememberTarget({ lowdefy, target }) {
  if (type.isNone(target.instanceKey)) {
    return;
  }
  const { pageId, pathParams, instanceKey } = target;
  lowdefy.pathMemory.set(target.pathname.slice(1), { pageId, pathParams, instanceKey });
}

export default rememberTarget;
