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
import MagicLinkEmail from './MagicLinkEmail.js';

test('MagicLinkEmail renders to html and text and includes the url', async () => {
  const { html, text } = await renderEmail({
    Template: MagicLinkEmail,
    properties: { url: 'https://example.com/verify?token=abc', organizationName: 'Acme' },
    theme: {},
  });
  expect(typeof html).toEqual('string');
  expect(html.length).toBeGreaterThan(0);
  expect(typeof text).toEqual('string');
  expect(text.length).toBeGreaterThan(0);
  expect(html).toContain('https://example.com/verify?token=abc');
});

// The button is the happy path, but a locked-down mail client may strip or
// rewrite it - the readable URL underneath is what a person falls back to, and
// the plain-text part is all some clients render at all.
test('MagicLinkEmail renders the url as readable fallback text under the button', async () => {
  const { html, text } = await renderEmail({
    Template: MagicLinkEmail,
    properties: { url: 'https://example.com/magic-link?token=abc' },
    theme: {},
  });
  expect(html).toContain('If the button does not work, copy this link into your browser:');
  expect(text).toContain('https://example.com/magic-link?token=abc');
});

test('MagicLinkEmail carries the one-time code below the button when an otp is given', async () => {
  const { html, text } = await renderEmail({
    Template: MagicLinkEmail,
    properties: { url: 'https://example.com/verify?token=abc', otp: '482913', expiresIn: 300 },
    theme: {},
  });
  expect(html).toContain('482913');
  expect(html).toContain('https://example.com/verify?token=abc');
  expect(text).toContain('Or enter this code where you requested the link');
  expect(text).toContain('expires in 5 minutes');
});

test('MagicLinkEmail renders no code section when no otp is given', async () => {
  const { text } = await renderEmail({
    Template: MagicLinkEmail,
    properties: { url: 'https://example.com/verify?token=abc' },
    theme: {},
  });
  expect(text).not.toContain('Or enter this code');
  expect(text).not.toContain('only be used once');
});

test('MagicLinkEmail subject is the expected string', () => {
  expect(MagicLinkEmail.subject).toEqual('Your sign-in link');
});
