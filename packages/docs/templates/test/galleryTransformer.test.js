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

import galleryTransformer from '../blocks/galleryTransformer.js';

function propertyRow(description) {
  const table = galleryTransformer(
    { properties: { properties: { prop: { type: 'string', description } } } },
    { table: 'properties' }
  );
  return table.split('\n')[2];
}

test('galleryTransformer keeps placeholders in code spans as written', () => {
  expect(propertyRow('Calls the `enrich_<id>` endpoint and reads `_enrich.<key>.value`.')).toBe(
    '| `prop` | string | - | Calls the `enrich_<id>` endpoint and reads `_enrich.<key>.value`. |'
  );
});

test('galleryTransformer escapes placeholders and element names outside code spans', () => {
  expect(
    propertyRow('Cells show "Invalid column: <reason>"; <style> and <script> are removed.')
  ).toBe(
    '| `prop` | string | - | Cells show "Invalid column: &lt;reason>"; &lt;style> and &lt;script> are removed. |'
  );
});

test('galleryTransformer turns anchor tags into markdown links', () => {
  expect(propertyRow('See <a href="/Button">Button</a> for <key> options.')).toBe(
    '| `prop` | string | - | See [Button](/Button) for &lt;key> options. |'
  );
  expect(propertyRow("See <a href='/Input'>Input</a>.")).toBe(
    '| `prop` | string | - | See [Input](/Input). |'
  );
});

test('galleryTransformer escapes placeholders in event, css key and slot descriptions', () => {
  const schema = {
    events: { onRun: { description: 'Fires `events.<name>` for <key>.', event: { key: 'x' } } },
    cssKeys: { element: 'The <div> root.' },
    slots: { empty: 'Blocks for <empty>.' },
  };
  expect(galleryTransformer(schema, { table: 'events' })).toContain(
    '| `onRun` | `{ key }` | Fires `events.<name>` for &lt;key>. |'
  );
  expect(galleryTransformer(schema, { table: 'cssKeys' })).toContain(
    '| `/element` | The &lt;div> root. |'
  );
  expect(galleryTransformer(schema, { table: 'slots' })).toContain(
    '| `empty` | Blocks for &lt;empty>. |'
  );
});
