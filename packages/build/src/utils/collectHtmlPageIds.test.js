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

import collectHtmlPageIds from './collectHtmlPageIds.js';

function collect(value) {
  return [...collectHtmlPageIds({ json: JSON.stringify(value) })];
}

test('collectHtmlPageIds finds double-quoted values escaped inside JSON strings', () => {
  expect(collect({ html: '<a data-page-id="contacts">Contacts</a>' })).toEqual(['contacts']);
});

test('collectHtmlPageIds finds single-quoted, unquoted, spaced and upper-case attributes', () => {
  expect(
    collect({
      a: "<a data-page-id='one'>1</a>",
      b: '<a data-page-id=two>2</a>',
      c: '<a data-page-id = "three">3</a>',
      d: '<a DATA-PAGE-ID="four">4</a>',
    })
  ).toEqual(['one', 'two', 'three', 'four']);
});

test('collectHtmlPageIds keeps module-scoped page ids', () => {
  expect(collect({ html: '<a data-page-id="users/view">x</a>' })).toEqual(['users/view']);
});

test('collectHtmlPageIds skips templated values', () => {
  expect(
    collect({
      a: '<a data-page-id="{{ page }}">x</a>',
      b: '<a data-page-id="tasks-{{ kind }}">x</a>',
      c: '<a data-page-id="${pageId}">x</a>',
    })
  ).toEqual([]);
});

test('collectHtmlPageIds finds values in JS source strings', () => {
  expect(collect(['return `<a data-page-id="report">${name}</a>`;'])).toEqual(['report']);
});
