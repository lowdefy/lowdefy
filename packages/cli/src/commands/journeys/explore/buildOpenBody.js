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

// The walk route's open body for a (page, role) target: recorded walks
// record (record: true); a confirmation replay records nothing but still
// claims its own errors (record: false).
function buildOpenBody({ target, run, walkId, options, record }) {
  const body = {
    pageId: target.pageId,
    run,
    walk: walkId,
    record,
    roles: target.roles,
    roleMatrixListed: target.matrixListed,
  };
  if (!type.isNone(target.user)) body.user = target.user;
  if (!type.isNone(options.data)) body.data = options.data;
  if (options.liveData) body.liveData = true;
  if (options.allowExternal.length > 0) body.allowExternal = options.allowExternal;
  return body;
}

export default buildOpenBody;
