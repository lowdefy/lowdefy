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
import waitForJourneyEmail from './waitForJourneyEmail.js';

// The words a person reads: the plain-text part, or the HTML without its tags
// for a message that has none. Tags and attributes are dropped so a pattern
// can not match inside a link's URL the reader never sees as text.
function readableText(message) {
  if (type.isString(message.text)) {
    return message.text;
  }
  return (message.html ?? '').replace(/<[^>]*>/g, ' ');
}

// Reads text from the newest email to `to` (subject containing `subject`),
// waiting for one like the email step, without leaving the actor's page: the
// person has the email open on another screen and types what it says - a
// one-time sign-in code - into the tab they started from. Returns the first
// match of `match`, or its first capture group when it has one.
async function readJourneyEmailMatch({ page, params, since, configDirectory, timeout }) {
  const { to, subject, match } = params;
  const message = await waitForJourneyEmail({
    page,
    params: { to, subject },
    since,
    configDirectory,
    timeout,
  });
  const text = readableText(message);
  const found = new RegExp(match).exec(text);
  if (found === null) {
    throw new JourneyStepError(
      `The email "${message.subject}" to "${to}" has no text matching ${JSON.stringify(match)}.`,
      { expected: `text matching ${JSON.stringify(match)}`, actual: text }
    );
  }
  return found[1] ?? found[0];
}

export default readJourneyEmailMatch;
