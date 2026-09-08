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
import DigestEmail from './DigestEmail.js';

test('DigestEmail renders title, intro, items and button', async () => {
  const { html, text } = await renderEmail({
    Template: DigestEmail,
    properties: {
      subject: 'Your weekly digest',
      title: 'This week at Acme',
      intro: 'Here is what **happened** this week.',
      button: { label: 'Open dashboard' },
    },
    data: {
      items: [
        {
          title: 'Item one',
          message: 'First item message',
          link: 'https://example.com/one',
          meta: '2 days ago',
        },
        { title: 'Item two', message: 'Second item message', link: 'https://example.com/two' },
      ],
    },
    links: { button: 'https://example.com/dashboard' },
  });
  expect(html).toContain('This week at Acme');
  expect(html).toContain('<strong>happened</strong>');
  expect(html).toContain('Item one');
  expect(html).toContain('https://example.com/one');
  expect(html).toContain('2 days ago');
  expect(html).toContain('Item two');
  expect(html).toContain('Open dashboard');
  expect(html).toContain('https://example.com/dashboard');
  expect(text).toContain('happened');
  expect(text).toContain('Item one');
});

test('DigestEmail omits item list when data.items is empty', async () => {
  const { html } = await renderEmail({
    Template: DigestEmail,
    properties: { subject: 'Your weekly digest', intro: 'Quiet week.' },
    data: { items: [] },
  });
  expect(html).toContain('Quiet week.');
  expect(html).not.toContain('<a');
});

test('DigestEmail statics are defined', () => {
  expect(DigestEmail.schema.required).toEqual(['subject']);
  expect(DigestEmail.markdownProperties).toEqual(['intro']);
  expect(DigestEmail.dataKeys).toEqual(['items']);
});
