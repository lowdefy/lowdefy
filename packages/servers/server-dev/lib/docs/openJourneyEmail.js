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

import waitForJourneyEmail from './waitForJourneyEmail.js';

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
}

// Opens the newest email to `to` (subject containing `subject`) received since
// the journey started - waiting for one when none has arrived - in the actor's
// tab, where `click` follows its links by their text and `expect.visible`
// checks its content.
async function openJourneyEmail({ page, params, since, configDirectory, timeout }) {
  const message = await waitForJourneyEmail({ page, params, since, configDirectory, timeout });
  const html = message.html ?? `<pre>${escapeHtml(message.text ?? '')}</pre>`;
  await page.goto(`data:text/html;charset=utf-8;base64,${Buffer.from(html).toString('base64')}`, {
    waitUntil: 'load',
    timeout,
  });
  // Email buttons open in a new tab; a journey drives one tab per actor, so a
  // link opens where the email is, the way the step after it expects.
  await page.evaluate(() => {
    document.querySelectorAll('a[target]').forEach((link) => link.removeAttribute('target'));
  });
}

export default openJourneyEmail;
