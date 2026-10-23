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

// A badge is a number, or { count, tone, dot }. A count of 0 shows nothing unless it is a dot.
function getBadge(value) {
  if (type.isNone(value)) return null;
  const badge = typeof value === 'object' ? value : { count: value };
  const count = Number(badge.count) || 0;
  if (!badge.dot && count <= 0) return null;
  const overflow = badge.overflowCount ?? 99;
  return {
    dot: badge.dot === true,
    text: count > overflow ? `${overflow}+` : String(count),
    tone: badge.tone === 'error' ? 'error' : 'default',
    label: badge.label,
  };
}

export default getBadge;
