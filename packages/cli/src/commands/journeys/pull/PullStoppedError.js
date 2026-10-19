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

// A pull that stopped cleanly before the window was done: PostHog asked for a
// wait longer than the pull will sit through (`rate_limit`, or the hourly
// `read_budget` for personal keys), or the window holds more rows than
// --max-rows allows (`max_rows`). Days already written stay written; the next
// run resumes from them.
class PullStoppedError extends Error {
  constructor(message, { reason, retryAt } = {}) {
    super(message);
    this.name = 'PullStoppedError';
    this.reason = reason;
    this.retryAt = retryAt;
  }
}

export default PullStoppedError;
