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

import recordTime from './recordTime.js';
import urlPath from './urlPath.js';

const CAUSE_WINDOW_MS = 5000;
const CAUSING_KINDS = ['click', 'key'];
// Records that say nothing about what the user did between an interaction and
// the page view it caused.
const PASSIVE_KINDS = ['engine', 'pageleave'];

// Whether a pageview was caused by the segment's own interaction before it. A
// click or key causes it when its event reports the pageview's path in
// `url_after`, or when it came no more than 5 s before it whatever the state
// of its event: production cannot see `url_after`, a plain anchor runs no
// event, and a Link action may not have moved the URL yet when its event is
// recorded. A `back` causes the pageview after it.
function classifyPageview({ pageview, previous }) {
  const cause = [...previous].reverse().find((record) => !PASSIVE_KINDS.includes(record.kind));
  if (type.isUndefined(cause)) return false;
  if (cause.kind === 'back') return true;
  if (!CAUSING_KINDS.includes(cause.kind)) return false;
  const path = urlPath({ url: pageview.url });
  if (type.isObject(cause.event) && !type.isUndefined(path)) {
    if (urlPath({ url: cause.event.url_after }) === path) return true;
  }
  const delay = recordTime({ record: pageview }) - recordTime({ record: cause });
  return delay >= 0 && delay <= CAUSE_WINDOW_MS;
}

export { CAUSE_WINDOW_MS };

export default classifyPageview;
