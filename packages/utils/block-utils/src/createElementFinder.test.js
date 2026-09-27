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

import createElementFinder from './createElementFinder.js';

function createRoot(html) {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

test.each([
  [
    'by its tag and data-* attributes, ignoring data-lf-* markers and other attributes',
    '<b data-id="1" data-lf-copy="" class="old">1</b><b data-id="2" data-lf-copy="">2</b>',
    0,
    '<b data-id="2" class="new">two</b><b data-id="1">one</b>',
    'one',
  ],
  [
    'at the same place among elements that say the same',
    '<b data-id="1">a</b><b data-id="1" data-lf-copy="">b</b>',
    1,
    '<p></p><b data-id="1">first</b><b data-id="1">second</b>',
    'second',
  ],
])('createElementFinder finds an element in new HTML %s', (_, oldHtml, index, newHtml, text) => {
  const root = createRoot(oldHtml);
  const findElement = createElementFinder({ element: root.children[index], root });
  expect(findElement(createRoot(newHtml)).textContent).toBe(text);
});

test.each([
  ['a data-* attribute changed', '<b data-id="3">x</b>'],
  ['the tag changed', '<i data-id="1">x</i>'],
  ['fewer elements say the same', ''],
])('createElementFinder finds nothing when %s', (_, newHtml) => {
  const root = createRoot('<b data-id="1">x</b>');
  const findElement = createElementFinder({ element: root.firstChild, root });
  expect(findElement(createRoot(newHtml))).toBeNull();
});
