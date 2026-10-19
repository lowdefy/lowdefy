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

function pad(number) {
  return String(number).padStart(2, '0');
}

function day(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function clock(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// The session's time span in local time, the day given once.
function describeSpan({ start, end }) {
  const from = new Date(start);
  const to = new Date(end);
  const until = day(from) === day(to) ? clock(to) : `${day(to)} ${clock(to)}`;
  return `${day(from)} ${clock(from)}–${until}`;
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function describeFailure(failure) {
  if (failure === null) return '';
  const action = type.isString(failure.action_type) ? `${failure.action_type} on ` : '';
  const invalid =
    failure.invalid_blocks.length > 0 ? ` [${failure.invalid_blocks.join(', ')}]` : '';
  return ` (first: ${action}${failure.block_id}${invalid})`;
}

// One line of the session list (summariseSessions' entry): its id, to pass
// back for the log, its time span, its pages and how many interactions and
// failures it holds.
function formatSessionSummary(session) {
  const parts = [session.id, describeSpan(session)];
  if (session.pages.length > 0) parts.push(session.pages.join(' → '));
  let counts = plural(session.interactions, 'interaction');
  if (session.failures > 0) {
    counts += `, ${session.failures} failed${describeFailure(session.firstFailure)}`;
  }
  parts.push(counts);
  return parts.join('   ');
}

export default formatSessionSummary;
