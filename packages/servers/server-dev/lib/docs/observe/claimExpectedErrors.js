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

import toAppErrorFailure from './toAppErrorFailure.js';

function describeErrors(findings) {
  if (findings.length === 0) {
    return 'no app error';
  }
  return findings.map((finding) => `${finding.kind}: ${finding.message}`);
}

function matches({ finding, text }) {
  return String(finding.message).includes(text);
}

// An expect.error step claims the app errors of the interaction just before
// it (held) and of its own window whose message contains its text. Returns
// the failure, or undefined when the claim passes: the expect step fails when
// no error matches, and the interaction fails on any error left unclaimed.
//
// An action-error is the trace's account of the action that failed, and the
// trace is value-free: its message names the action and the error class, never
// the error's text. So once an error with the text is claimed, the failed
// action that reported it is claimed with it. An event stops at its first
// failed action, so this claims no second, unrelated failure of the event.
function claimExpectedErrors({ step, index, held, findings }) {
  const text = step.expect.error;
  const seen = [...(held?.findings ?? []), ...findings];
  const matched = seen.filter((finding) => matches({ finding, text }));
  const claimed =
    matched.length === 0
      ? []
      : seen.filter((finding) => matches({ finding, text }) || finding.kind === 'action-error');
  if (claimed.length === 0) {
    const actual = describeErrors(seen);
    return {
      index,
      step,
      expected: `an app error containing "${text}"`,
      actual,
      message: `Expected an app error containing "${text}" but found ${
        seen.length === 0 ? 'no app error.' : actual.join('; ')
      }`,
    };
  }
  const unclaimed = seen.filter((finding) => !claimed.includes(finding));
  if (unclaimed.length === 0) {
    return undefined;
  }
  return toAppErrorFailure({ findings: unclaimed, index: held.index, step: held.step });
}

export default claimExpectedErrors;
