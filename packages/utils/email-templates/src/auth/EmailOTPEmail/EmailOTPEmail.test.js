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
import EmailOTPEmail from './EmailOTPEmail.js';

test('EmailOTPEmail renders to html and text and includes the code', async () => {
  const { html, text } = await renderEmail({
    Template: EmailOTPEmail,
    properties: { otp: '482913', expiresIn: 300 },
    theme: {},
  });
  expect(html).toContain('482913');
  expect(html).toContain('Your sign-in code');
  expect(text).toContain('482913');
});

test('EmailOTPEmail states the expiry in minutes, rounded up from seconds', async () => {
  const { text } = await renderEmail({
    Template: EmailOTPEmail,
    properties: { otp: '482913', expiresIn: 300 },
    theme: {},
  });
  expect(text).toContain('expires in 5 minutes');
});

test('EmailOTPEmail rounds a part-minute expiry up so it never promises less time than the code has', async () => {
  const { text } = await renderEmail({
    Template: EmailOTPEmail,
    properties: { otp: '482913', expiresIn: 90 },
    theme: {},
  });
  expect(text).toContain('expires in 2 minutes');
});

test('EmailOTPEmail uses the singular for a one minute expiry', async () => {
  const { text } = await renderEmail({
    Template: EmailOTPEmail,
    properties: { otp: '482913', expiresIn: 60 },
    theme: {},
  });
  expect(text).toContain('expires in 1 minute and');
});

test('EmailOTPEmail says the code is single use even without an expiry', async () => {
  const { text } = await renderEmail({
    Template: EmailOTPEmail,
    properties: { otp: '482913' },
    theme: {},
  });
  expect(text).toContain('only be used once');
});

test('EmailOTPEmail subject is the expected string', () => {
  expect(EmailOTPEmail.subject).toEqual('Your sign-in code');
});
