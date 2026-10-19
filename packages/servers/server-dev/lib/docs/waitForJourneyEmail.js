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

import JourneyStepError from './JourneyStepError.js';
import readMailOutbox from './readMailOutbox.js';

const POLL_MS = 100;

function describeWanted({ to, subject }) {
  if (type.isUndefined(subject)) {
    return `an email to "${to}"`;
  }
  return `an email to "${to}" with a subject containing "${subject}"`;
}

// Mail received before the journey started belongs to an earlier run against
// the same dev server, so it is never a candidate.
function isCandidate({ message, since }) {
  return Date.parse(message.receivedAt) >= since;
}

function findNewest({ messages, to, subject, since }) {
  const address = to.toLowerCase();
  const matches = messages.filter(
    (message) =>
      isCandidate({ message, since }) &&
      message.to.some((recipient) => recipient.toLowerCase() === address) &&
      (type.isUndefined(subject) || message.subject.includes(subject))
  );
  return matches[matches.length - 1];
}

// The newest email to `to` (subject containing `subject`) received since the
// journey started, waiting up to `timeout` for one to arrive. Newest, like a
// person opening their inbox: an email the journey caused is sent within the
// request that caused it, so it is already here when the next step runs, and
// reading an email twice (an invitation link clicked again after signing up)
// reads the same one.
async function waitForJourneyEmail({ page, params, since, configDirectory, timeout }) {
  const { to, subject } = params;
  const deadline = Date.now() + timeout;
  let messages = await readMailOutbox({ configDirectory });
  let message = findNewest({ messages, to, subject, since });
  while (type.isUndefined(message)) {
    if (Date.now() >= deadline) {
      const received = messages
        .filter((candidate) => isCandidate({ message: candidate, since }))
        .map((candidate) => `"${candidate.subject}" to ${candidate.to.join(', ')}`);
      const expected = describeWanted({ to, subject });
      throw new JourneyStepError(`Timed out after ${timeout}ms waiting for ${expected}.`, {
        expected,
        actual: received.length > 0 ? received : 'no email received during this journey',
      });
    }
    await page.waitForTimeout(POLL_MS);
    messages = await readMailOutbox({ configDirectory });
    message = findNewest({ messages, to, subject, since });
  }
  return message;
}

export default waitForJourneyEmail;
