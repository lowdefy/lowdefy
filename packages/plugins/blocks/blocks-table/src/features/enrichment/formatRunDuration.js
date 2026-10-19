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

import dayjs from 'dayjs';
import { type } from '@lowdefy/helpers';

// How long a run took, from its `startedAt` to its `finishedAt` (Dates or ISO strings), for the
// details panel: "0.4 s" and "1.2 s" under 10 seconds, "42 s", "3 min 5 s", "1 h 2 min". null
// when either time is missing or invalid, or the run finished before it started.
function formatRunDuration({ startedAt, finishedAt }) {
  if (type.isNone(startedAt) || type.isNone(finishedAt)) return null;
  const start = dayjs(startedAt);
  const end = dayjs(finishedAt);
  if (!start.isValid() || !end.isValid()) return null;
  const ms = end.diff(start);
  if (ms < 0) return null;
  if (ms < 10000) return `${Number((ms / 1000).toFixed(1))} s`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) {
    const rest = seconds % 60;
    return rest === 0
      ? `${Math.floor(seconds / 60)} min`
      : `${Math.floor(seconds / 60)} min ${rest} s`;
  }
  const minutes = Math.round(seconds / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${Math.floor(minutes / 60)} h` : `${Math.floor(minutes / 60)} h ${rest} min`;
}

export default formatRunDuration;
