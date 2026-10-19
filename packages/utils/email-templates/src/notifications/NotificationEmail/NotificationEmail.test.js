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

import interpolateProperties from '../../interpolate/interpolateProperties.js';
import renderEmail from '../../renderEmail.js';
import NotificationEmail from './NotificationEmail.js';

test('NotificationEmail renders all sections to html and text', async () => {
  const { html, text } = await renderEmail({
    Template: NotificationEmail,
    properties: {
      subject: 'New comment',
      title: 'A new comment was added',
      message: 'Someone **commented** on your item.',
      metadata: [{ label: 'Status', value: 'Open' }],
      quote: { text: 'Nice work on this', author: 'Jane Doe' },
      button: { label: 'View comment' },
    },
    data: {
      actions: [
        { title: 'Approve item', message: 'Approve directly', link: 'https://example.com/approve' },
      ],
    },
    theme: { companyName: 'Acme Inc', signature: 'The Acme Team', footer: 'Acme Inc, 1 Main St' },
    links: { button: 'https://example.com/comment' },
  });
  expect(typeof html).toEqual('string');
  expect(typeof text).toEqual('string');
  expect(html).toContain('A new comment was added');
  expect(html).toContain('<strong>commented</strong>');
  expect(html).toContain('Status');
  expect(html).toContain('Open');
  expect(html).toContain('Nice work on this');
  expect(html).toContain('Jane Doe');
  expect(html).toContain('Approve item');
  expect(html).toContain('https://example.com/approve');
  expect(html).toContain('View comment');
  expect(html).toContain('https://example.com/comment');
  expect(html).toContain('Acme Inc');
  expect(html).toContain('The Acme Team');
});

test('NotificationEmail plain text output contains the markdown message content', async () => {
  const { text } = await renderEmail({
    Template: NotificationEmail,
    properties: {
      subject: 'New comment',
      title: 'A new comment was added',
      message: 'Someone **commented** on your item.',
    },
  });
  expect(text).toContain('commented');
  // The plain text renderer uppercases headings.
  expect(text.toLowerCase()).toContain('a new comment was added');
});

test('NotificationEmail omits sections when properties are absent', async () => {
  const { html } = await renderEmail({
    Template: NotificationEmail,
    properties: { subject: 'New comment', message: 'Plain message.' },
    data: { actions: [] },
  });
  // No quote and no markdown blockquote means no left border styling anywhere.
  expect(html).not.toContain('border-left');
  expect(html).not.toContain('<h2');
  // Layout components render tables, but no metadata means no label/value cells with padding.
  expect(html).not.toContain('padding:4px 0');
});

test('NotificationEmail omits button when links.button is missing', async () => {
  const { html } = await renderEmail({
    Template: NotificationEmail,
    properties: { subject: 'New comment', message: 'Hello.', button: { label: 'View comment' } },
  });
  expect(html).not.toContain('View comment');
});

test('NotificationEmail renders interpolated data inert in markdown message', async () => {
  const properties = interpolateProperties({
    properties: {
      subject: 'New comment from {{ name }}',
      message: 'Comment:\n\n{{ comment }}',
    },
    data: {
      name: 'Mallory',
      comment: '[click](https://evil.example) <script>alert(1)</script>',
    },
    markdownProperties: NotificationEmail.markdownProperties,
  });
  const { html, text } = await renderEmail({ Template: NotificationEmail, properties });
  expect(html).not.toContain('<a href="https://evil.example');
  expect(html).not.toContain('href="https://evil.example');
  expect(html).not.toContain('<script>');
  expect(html).toContain('[click](https://evil.example)');
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  expect(text).toContain('[click](https://evil.example)');
});

test('NotificationEmail statics are defined', () => {
  expect(NotificationEmail.schema.required).toEqual(['subject']);
  expect(NotificationEmail.markdownProperties).toEqual(['message']);
  expect(NotificationEmail.dataKeys).toEqual(['actions']);
});
