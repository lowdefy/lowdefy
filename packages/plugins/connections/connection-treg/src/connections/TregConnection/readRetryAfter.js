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

// The seconds a caller should wait before retrying, from (in order) the Retry-After header
// (seconds or an HTTP date), treg's retry_after / retry_after_s body fields, and resets_at,
// the time treg's own provider account is expected to have capacity again.
function readRetryAfter({ headers, detail, now = Date.now() }) {
  const header = headers.get('retry-after');
  if (type.isString(header) && header.trim() !== '') {
    const value = header.trim();
    if (/^[0-9]+$/.test(value)) return Number.parseInt(value, 10);
    const date = Date.parse(value);
    if (!Number.isNaN(date)) return Math.max(0, Math.ceil((date - now) / 1000));
  }
  const fromBody = detail.retry_after ?? detail.retry_after_s;
  if (type.isNumber(fromBody) && fromBody >= 0) return Math.ceil(fromBody);
  if (type.isString(detail.resets_at)) {
    const resetsAt = Date.parse(detail.resets_at);
    if (!Number.isNaN(resetsAt)) return Math.max(0, Math.ceil((resetsAt - now) / 1000));
  }
  return null;
}

export default readRetryAfter;
