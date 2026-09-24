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

import renderEmail from '../../renderEmail.js';
import InvitationEmail from './InvitationEmail.js';

test('InvitationEmail renders to html and text and includes the url', async () => {
  const { html, text } = await renderEmail({
    Template: InvitationEmail,
    properties: { url: 'https://example.com/verify?token=abc', organizationName: 'Acme' },
    theme: {},
  });
  expect(typeof html).toEqual('string');
  expect(html.length).toBeGreaterThan(0);
  expect(typeof text).toEqual('string');
  expect(text.length).toBeGreaterThan(0);
  expect(html).toContain('https://example.com/verify?token=abc');
});

test('InvitationEmail subject builds the organization name', () => {
  expect(InvitationEmail.subject({ organizationName: 'Acme' })).toEqual(
    "You've been invited to Acme"
  );
});
