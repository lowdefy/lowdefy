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

import { getCurrentApp } from '../../native/currentApp.js';

/**
 * The requestQueue device feature (GetRequestQueue, RetryRequestQueue, DiscardQueuedRequest): the
 * open app's offline request queue (src/queue/createRequestQueue.js).
 */
function createRequestQueueFeature() {
  return {
    async get() {
      return (await getCurrentApp()).requestQueue.get();
    },
    async retry(params) {
      return (await getCurrentApp()).requestQueue.retry(params);
    },
    async discard(params) {
      return (await getCurrentApp()).requestQueue.discard(params);
    },
  };
}

export default createRequestQueueFeature;
