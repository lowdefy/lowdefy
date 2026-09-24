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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getOperatorType, serializer, type } from '@lowdefy/helpers';

// The production client loads each page's own client types. An operator missing
// from them is not an error - WebParser passes unknown operators through as data
// - so this walks every fixture page's written config independently of the build
// counters and checks the page's type set covers what the page uses.
const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tests/success');

function walkOperators(value, found) {
  if (type.isArray(value)) {
    value.forEach((item) => walkOperators(item, found));
    return;
  }
  if (!type.isObject(value)) {
    return;
  }
  const operator = getOperatorType(value);
  if (operator) {
    found.add(operator);
  }
  Object.keys(value)
    .filter((key) => !key.startsWith('~'))
    .forEach((key) => walkOperators(value[key], found));
}

function walkBlock(block, used) {
  used.blocks.add(block.type);
  Object.values(block.events ?? {}).forEach((event) => {
    const actions = type.isArray(event) ? event : [...(event.try ?? []), ...(event.catch ?? [])];
    actions.forEach((action) => used.actions.add(action.type));
  });
  // Request properties evaluate on the server; the payload evaluates in the browser.
  const { requests, slots, ...clientBlock } = block;
  walkOperators(clientBlock, used.operators);
  (requests ?? []).forEach((request) => walkOperators(request.payload ?? {}, used.operators));
  Object.values(slots ?? {}).forEach((slot) => {
    // The slot's own config (less blocks) evaluates in the browser as slotsLayout.
    const { blocks, ...slotLayout } = slot;
    walkOperators(slotLayout, used.operators);
    (blocks ?? []).forEach((child) => walkBlock(child, used));
  });
}

const fixtures = fs
  .readdirSync(fixturesDir)
  .filter((name) => fs.existsSync(path.join(fixturesDir, name, 'snapshot.json')))
  .sort();

test.each(fixtures)('page type sets cover every client type each page uses: %s', (fixture) => {
  const snapshot = JSON.parse(
    fs.readFileSync(path.join(fixturesDir, fixture, 'snapshot.json'), 'utf8')
  );
  const appTypes = snapshot['types.json'];
  const pageTypeSets = snapshot['pageTypeSets.json'];
  const pageKeys = Object.keys(snapshot).filter((key) => /^pages\/[^/]+\.json$/.test(key));
  pageKeys.forEach((pageKey) => {
    // Snapshots hold the written (serialized) form; the client reads it deserialized.
    const page = serializer.deserialize(snapshot[pageKey]);
    const pageTypeSet = pageTypeSets[page.pageId];
    const used = { actions: new Set(), blocks: new Set(), operators: new Set() };
    walkBlock(page, used);
    // Only installed operators evaluate; the rest stay data everywhere.
    const clientOperators = [...used.operators].filter((op) => appTypes.operators.client[op]);
    expect({
      page: page.pageId,
      missing: [...used.blocks].filter((t) => !pageTypeSet.blocks.includes(t)),
    }).toEqual({ page: page.pageId, missing: [] });
    expect({
      page: page.pageId,
      missing: [...used.actions].filter((t) => !pageTypeSet.actions.includes(t)),
    }).toEqual({ page: page.pageId, missing: [] });
    expect({
      page: page.pageId,
      missing: clientOperators.filter((t) => !pageTypeSet.operators.includes(t)),
    }).toEqual({ page: page.pageId, missing: [] });
    // And the page set never names a type the app does not bundle.
    expect(pageTypeSet.blocks.filter((t) => !appTypes.blocks[t])).toEqual([]);
    expect(pageTypeSet.actions.filter((t) => !appTypes.actions[t])).toEqual([]);
    expect(pageTypeSet.operators.filter((t) => !appTypes.operators.client[t])).toEqual([]);
    expect(snapshot[`plugins/pageTypes/${page.typesKey}.js`]).toBeDefined();
  });
});
