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

import buildPreviewProps from './buildPreviewProps.js';
import DigestEmail from './notifications/DigestEmail/DigestEmail.js';
import NotificationEmail from './notifications/NotificationEmail/NotificationEmail.js';

test('buildPreviewProps interpolates properties with testData', () => {
  const result = buildPreviewProps({
    Template: NotificationEmail,
    config: {
      properties: { subject: 'Hello {{ name }}', message: 'From {{ name }}' },
      testData: { name: 'Jane' },
    },
  });
  expect(result.properties).toEqual({ subject: 'Hello Jane', message: 'From Jane' });
});

test('buildPreviewProps escapes markdown fields using Template.markdownProperties', () => {
  const result = buildPreviewProps({
    Template: NotificationEmail,
    config: {
      properties: { subject: '{{ comment }}', message: '{{ comment }}' },
      testData: { comment: '[click](https://evil.example)' },
    },
  });
  expect(result.properties.subject).toEqual('[click](https://evil.example)');
  expect(result.properties.message).toEqual('\\[click\\]\\(https\\:\\/\\/evil\\.example\\)');
});

test('buildPreviewProps resolves pageId links to relative urls', () => {
  const result = buildPreviewProps({
    Template: NotificationEmail,
    config: {
      properties: { subject: 'Hello' },
      testData: {
        links: {
          button: { pageId: 'item-details', urlQuery: { id: '123' } },
          plain: { pageId: 'home' },
        },
      },
    },
  });
  expect(result.links.button).toEqual('/item-details?id=123');
  expect(result.links.plain).toEqual('/home');
});

test('buildPreviewProps passes absolute urls through', () => {
  const result = buildPreviewProps({
    Template: NotificationEmail,
    config: {
      properties: { subject: 'Hello' },
      testData: { links: { button: 'https://example.com/item' } },
    },
  });
  expect(result.links.button).toEqual('https://example.com/item');
});

test('buildPreviewProps resolves item links inside dataKeys arrays', () => {
  const result = buildPreviewProps({
    Template: DigestEmail,
    config: {
      properties: { subject: 'Digest' },
      testData: {
        items: [
          { title: 'One', link: { pageId: 'item', urlQuery: { id: '1' } } },
          { title: 'Two', link: 'https://example.com/two' },
        ],
      },
    },
  });
  expect(result.data.items[0].link).toEqual('/item?id=1');
  expect(result.data.items[1].link).toEqual('https://example.com/two');
});

test('buildPreviewProps does not mutate testData when resolving item links', () => {
  const testData = {
    items: [{ title: 'One', link: { pageId: 'item' } }],
  };
  buildPreviewProps({
    Template: DigestEmail,
    config: { properties: { subject: 'Digest' }, testData },
  });
  expect(testData.items[0].link).toEqual({ pageId: 'item' });
});

test('buildPreviewProps passes theme through', () => {
  const result = buildPreviewProps({
    Template: NotificationEmail,
    config: {
      properties: { subject: 'Hello' },
      testData: {},
      theme: { primaryColor: '#ff0000' },
    },
  });
  expect(result.theme).toEqual({ primaryColor: '#ff0000' });
});
