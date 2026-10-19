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

import buildWaitHeader from './buildWaitHeader.js';

// A build can restart this process, which ends any wait running in it, so
// the manager's proxy waits for builds and restarts before it forwards a
// build-status wait, and passes what it saw in this header. Null when the
// request did not come through that wait.
function readProxyBuildWait({ getHeader }) {
  const header = getHeader(buildWaitHeader);
  if (type.isNone(header)) {
    return null;
  }
  const params = new URLSearchParams(header);
  return {
    settled: params.get('settled') === 'true',
    sawBuild: params.get('sawBuild') === 'true',
    waitedMs: Number(params.get('waitedMs')),
  };
}

export default readProxyBuildWait;
