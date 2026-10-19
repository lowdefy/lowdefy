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

import renderEmail from './renderEmail.js';
import NotificationEmail from './notifications/NotificationEmail/NotificationEmail.js';

test('renderEmail returns html and text and no subject', async () => {
  const result = await renderEmail({
    Template: NotificationEmail,
    properties: { subject: 'Hello', title: 'A title', message: 'A message.' },
  });
  expect(Object.keys(result).sort()).toEqual(['html', 'text']);
  expect(result.html).toContain('<!DOCTYPE html');
  expect(result.html).toContain('A title');
  // The plain text renderer uppercases headings.
  expect(result.text.toLowerCase()).toContain('a title');
  expect(result.text).not.toContain('<p');
});

test('renderEmail passes theme and links to the template', async () => {
  const { html } = await renderEmail({
    Template: NotificationEmail,
    properties: { subject: 'Hello', message: 'A message.', button: { label: 'Go there' } },
    theme: { companyName: 'Acme Inc' },
    links: { button: 'https://example.com/go' },
  });
  expect(html).toContain('Acme Inc');
  expect(html).toContain('https://example.com/go');
});
