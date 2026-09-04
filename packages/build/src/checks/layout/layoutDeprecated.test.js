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
import layoutDeprecated from './layoutDeprecated.js';
import { createLayoutContext, layoutComponents } from './testFixture.js';

const keyMap = {
  k_sidebar: { key: 'sidebar', '~r': 'r1', '~l': 3 },
  k_main: { key: 'main', '~r': 'r1', '~l': 8 },
  k_toolbar: { key: 'toolbar', '~r': 'r2', '~l': 2 },
};
const refMap = { r1: { path: 'pages/home.yaml' }, r2: { path: 'pages/parts/toolbar.yaml' } };

function runRule() {
  const context = createLayoutContext({ keyMap, refMap });
  layoutDeprecated.run({ components: layoutComponents(), context });
  return context;
}

function messageFor(context, configKey) {
  return context.warnings.find((warning) => warning.configKey === configKey)?.message;
}

test('layoutDeprecated runs under check only and never fails a build', () => {
  expect(layoutDeprecated.slug).toBe('layout-deprecated');
  expect(layoutDeprecated.checkOnly).toBe(true);
});

test('layoutDeprecated warns once per layout site plus one summary', () => {
  const context = runRule();
  expect(context.warnings).toHaveLength(8);
  expect(context.warnings.every((warning) => warning.name === 'ConfigWarning')).toBe(true);
  expect(context.warnings.every((warning) => warning.checkSlug === 'layout-deprecated')).toBe(true);
});

test('layoutDeprecated points a span site at Grid with col-span classes', () => {
  expect(messageFor(runRule(), 'k_sidebar')).toBe(
    'Block "sidebar" on page "home" uses layout: (span). Wrap the siblings in a `Grid` (columns: 24) and set `class: col-span-N` on each child. layout: keeps working in v8. The "layout-to-containers" codemod does the rewrite.'
  );
});

test('layoutDeprecated names the cumulative col-start rule when offset is used', () => {
  expect(messageFor(runRule(), 'k_main')).toBe(
    'Block "main" on page "home" uses layout: (span, offset). Wrap the siblings in a `Grid` (columns: 24) and set `class: col-span-N` on each child, with offset accumulated into `col-start-N`. layout: keeps working in v8. The "layout-to-containers" codemod does the rewrite.'
  );
});

test('layoutDeprecated points a flex site at Row with Tailwind flex utilities', () => {
  expect(messageFor(runRule(), 'k_toolbar')).toBe(
    'Block "toolbar" on page "home" uses layout: (grow, shrink, size). Wrap the siblings in a `Row` and express flex with Tailwind utilities (`grow`, `shrink-0`, `basis-1/3`, `w-64`). layout: keeps working in v8. The "layout-to-containers" codemod does the rewrite.'
  );
});

test('layoutDeprecated maps selfAlign to a self-* class', () => {
  expect(messageFor(runRule(), 'k_badge')).toBe(
    'Block "badge" on page "home" uses layout: (selfAlign). Replace layout.selfAlign with a `self-*` class on the child. layout: keeps working in v8. The "layout-to-containers" codemod does the rewrite.'
  );
});

test('layoutDeprecated reports a column-direction slot as a Stack and moves gap to its properties', () => {
  expect(messageFor(runRule(), 'k_column_box_content')).toBe(
    'Block "column_box" on page "home" sets area layout keys on slots.content (direction, gap). Replace the column area with a `Stack`. Move gap onto the `Stack` properties. layout: keeps working in v8. The "layout-to-containers" codemod does the rewrite.'
  );
});

test('layoutDeprecated reports an operator-valued layout as a hand conversion', () => {
  expect(messageFor(runRule(), 'k_dynamic_block')).toBe(
    'Block "dynamic_block" on page "home" has an operator-valued layout:. Dynamic: convert to class: { _if: … } by hand. layout: keeps working in v8. The "layout-to-containers" codemod does the rewrite.'
  );
});

test('layoutDeprecated gives no wrapper advice for a key whose value is an operator', () => {
  expect(messageFor(runRule(), 'k_partly_dynamic')).toBe(
    'Block "partly_dynamic" on page "home" uses layout: (span). span is operator-valued. Dynamic: convert to class: { _if: … } by hand. layout: keeps working in v8. The "layout-to-containers" codemod does the rewrite.'
  );
});

test('layoutDeprecated summarises the site and file counts last', () => {
  const context = runRule();
  expect(context.warnings.at(-1).message).toBe(
    'layout: is deprecated: 7 sites in 2 files. Row, Grid and Stack replace it. Run the "layout-to-containers" codemod to rewrite them; layout: keeps working in v8.'
  );
  expect(context.warnings.at(-1).configKey).toBe(null);
});

test('layoutDeprecated is silent for an app with no layout keys', () => {
  const context = createLayoutContext();
  layoutDeprecated.run({
    components: {
      pages: [
        {
          pageId: 'home',
          blockId: 'home',
          '~k': 'k_home',
          slots: { content: { blocks: [{ blockId: 'a', '~k': 'k_a', class: 'col-span-8' }] } },
        },
      ],
    },
    context,
  });
  expect(context.warnings).toEqual([]);
});
