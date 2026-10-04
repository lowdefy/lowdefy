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

import buildOpenBody from './buildOpenBody.js';

// Replays a walk that ended on an error finding, on a fresh walk (a fresh
// data session, recording nothing, under its own walk id so it claims only
// its own errors), up to the finding's step. The finding is confirmed when
// the same finding key fires at that step or before it; a replay that cannot
// reach the step (a step no longer offered, the page gone) leaves it
// unconfirmed. A finding from the walk's open (role-refused) is replayed by
// opening alone. Returns { status: 'confirmed' | 'unconfirmed', replay, ms }.
async function confirmFinding({ client, run, log, finding, target, options, now = Date.now }) {
  const started = now();
  const replay = `${log.walk}-confirm`;
  const opened = await client.open(
    buildOpenBody({ target, run, walkId: replay, options, record: false })
  );
  function done(status) {
    return { status, replay, ms: now() - started };
  }
  if (opened.status !== 200) return done('unconfirmed');
  const { walkId } = opened.body;
  try {
    if ((opened.body.findings ?? []).some((item) => item.key === finding.key)) {
      return done('confirmed');
    }
    if (type.isNone(finding.step)) return done('unconfirmed');
    const steps = log.steps.filter((entry) => entry.index <= finding.step);
    for (const entry of steps) {
      const stepped = await client.step({ walkId, step: entry.step });
      if (stepped.status !== 200) return done('unconfirmed');
      if (stepped.body.findings.some((item) => item.key === finding.key)) {
        return done('confirmed');
      }
    }
    return done('unconfirmed');
  } finally {
    await client.close({ walkId }).catch(() => {});
  }
}

export default confirmFinding;
