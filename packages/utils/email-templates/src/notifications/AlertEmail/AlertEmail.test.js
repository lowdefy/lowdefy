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
import AlertEmail from './AlertEmail.js';

test('AlertEmail renders title, message, metadata and button', async () => {
  const { html, text } = await renderEmail({
    Template: AlertEmail,
    properties: {
      subject: 'Server alert',
      tone: 'error',
      title: 'Server is down',
      message: 'The server stopped **responding**.',
      metadata: [{ label: 'Region', value: 'eu-west-1' }],
      button: { label: 'View status' },
    },
    links: { button: 'https://example.com/status' },
  });
  expect(html).toContain('Server is down');
  expect(html).toContain('<strong>responding</strong>');
  expect(html).toContain('Region');
  expect(html).toContain('eu-west-1');
  expect(html).toContain('View status');
  expect(html).toContain('https://example.com/status');
  expect(text).toContain('responding');
});

test('AlertEmail renders tone accent colors', async () => {
  const tones = {
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
  };
  for (const [tone, color] of Object.entries(tones)) {
    const { html } = await renderEmail({
      Template: AlertEmail,
      properties: { subject: 'Alert', tone, message: 'Hello.' },
    });
    expect(html).toContain(color);
  }
});

test('AlertEmail info tone uses the theme primary color', async () => {
  const { html } = await renderEmail({
    Template: AlertEmail,
    properties: { subject: 'Alert', tone: 'info', message: 'Hello.' },
    theme: { primaryColor: '#123456' },
  });
  expect(html).toContain('#123456');
});

test('AlertEmail defaults to info tone with the default primary color', async () => {
  const { html } = await renderEmail({
    Template: AlertEmail,
    properties: { subject: 'Alert', message: 'Hello.' },
  });
  expect(html).toContain('#1990ff');
});

test('AlertEmail statics are defined', () => {
  expect(AlertEmail.schema.required).toEqual(['subject']);
  expect(AlertEmail.schema.properties.tone.enum).toEqual(['info', 'success', 'warning', 'error']);
  expect(AlertEmail.markdownProperties).toEqual(['message']);
  expect(AlertEmail.dataKeys).toEqual([]);
});
