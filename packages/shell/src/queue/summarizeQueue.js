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

/**
 * The queue as pages see it (GetRequestQueue, onRequestQueue): counts and the items without their
 * bodies.
 *
 * @param {Object[]} items The stored items, in order.
 */
function summarizeQueue(items) {
  return {
    pending: items.filter((item) => item.status === 'pending').length,
    failed: items.filter((item) => item.status === 'failed').length,
    items: items.map(({ attempts, error, id, pageId, queuedAt, requestId, status }) => ({
      attempts,
      error,
      id,
      pageId,
      queuedAt,
      requestId,
      status,
    })),
  };
}

export default summarizeQueue;
