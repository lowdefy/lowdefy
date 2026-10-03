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

function clock(iso) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
    2,
    '0'
  )}`;
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function describeFailure(failure) {
  if (failure === null) return '';
  const action = type.isString(failure.action_type) ? `${failure.action_type} on ` : '';
  const invalid = failure.invalid_blocks.length > 0 ? `: ${failure.invalid_blocks.join(', ')}` : '';
  return ` (${action}${failure.block_id}${invalid})`;
}

// One line of `lowdefy journeys recordings`: the session's time span (local
// time), the builds it ran against, its pages, attempts and failures, and how
// much the newest test run already drives.
function formatSessionLine(session) {
  const span = `${clock(session.start)}–${clock(session.end)}`;
  const builds =
    session.builds.length === 0
      ? 'build unknown'
      : `build ${session.builds.map((build) => clock(build)).join(', ')}`;
  const pages = session.pages.join(' → ');
  let attempts = plural(session.attempts, 'attempt');
  if (session.failed > 0) {
    attempts += `, ${session.failed} failed${describeFailure(session.firstFailure)}`;
  }
  const parts = [span, builds, pages, attempts];
  if (session.covered !== null) {
    parts.push(`${session.covered}/${session.total} interactions already covered by tests`);
  }
  return parts.join('   ');
}

export default formatSessionLine;
