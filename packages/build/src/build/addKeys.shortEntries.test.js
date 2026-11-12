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

import { resolveConfigLocation, resolveKeyEntry } from '@lowdefy/errors';
import { expect, test } from 'vitest';

import addKeys from './addKeys.js';
import testContext from '../test-utils/testContext.js';
import makeId from '../utils/makeId.js';

// lowdefy.yaml holds the root and the pages array; pages.yaml is _ref'd in as
// the first page, and its button's events come from events.yaml. The page's
// title block has no ~r of its own, as a node a build step creates has none.
function components() {
  return {
    '~r': 'refRoot',
    '~l': 1,
    pages: Object.assign(
      [
        {
          '~r': 'refPage',
          '~l': 1,
          id: 'home',
          type: 'Box',
          blocks: Object.assign(
            [
              {
                '~r': 'refPage',
                '~l': 4,
                id: 'button',
                type: 'Button',
                '~ignoreBuildChecks': ['state-refs'],
                events: {
                  '~r': 'refEvents',
                  '~l': 1,
                  onClick: Object.assign([{ '~r': 'refEvents', '~l': 2, id: 'go', type: 'Link' }], {
                    '~r': 'refEvents',
                    '~l': 2,
                  }),
                },
              },
              { id: 'title', type: 'Title', properties: { content: 'Hi' } },
            ],
            { '~r': 'refPage', '~l': 3 }
          ),
          grid: Object.assign(
            [Object.assign([{ '~r': 'refPage', '~l': 9, x: 1 }], { '~r': 'refPage' })],
            {
              '~r': 'refPage',
            }
          ),
        },
      ],
      { '~r': 'refRoot', '~l': 2 }
    ),
  };
}

const refMap = {
  refRoot: { parent: null, path: 'lowdefy.yaml' },
  refPage: { parent: 'refRoot', path: 'pages.yaml' },
  refEvents: { parent: 'refPage', path: 'events.yaml' },
};

function keyed() {
  makeId.reset();
  const context = testContext();
  const config = components();
  addKeys({ components: config, context });
  return { config, context };
}

function entryOf({ context, node }) {
  return context.keyMap[node['~k']];
}

test('addKeys writes the root as segment root under a parent id it never writes', () => {
  const { config, context } = keyed();
  const entry = entryOf({ context, node: config });
  expect(entry).toEqual({ s: 'root', p: '1', r: 'refRoot', l: 1 });
  expect(context.keyMap[entry.p]).toBeUndefined();
});

test('addKeys writes object keys and array items with id and type as segments', () => {
  const { config, context } = keyed();
  const page = config.pages[0];
  expect(entryOf({ context, node: config.pages })).toEqual({ s: '.pages', p: config['~k'], l: 2 });
  expect(entryOf({ context, node: page })).toEqual({
    s: '[0:home:Box]',
    p: config.pages['~k'],
    r: 'refPage',
    l: 1,
  });
  expect(entryOf({ context, node: page.blocks[0] })).toMatchObject({
    s: '[0:button:Button]',
    p: page.blocks['~k'],
  });
  expect(entryOf({ context, node: page.blocks[0].events })).toMatchObject({ s: '.events' });
});

test('addKeys writes a nested array as index segments', () => {
  const { config, context } = keyed();
  const grid = config.pages[0].grid;
  expect(entryOf({ context, node: grid[0] })).toEqual({ s: '[0]', p: grid['~k'] });
  expect(entryOf({ context, node: grid[0][0] })).toEqual({ s: '[0]', p: grid[0]['~k'], l: 9 });
  expect(resolveKeyEntry({ keyMap: context.keyMap, configKey: grid[0][0]['~k'] }).path).toEqual(
    'root.pages[0:home:Box].grid[0][0]'
  );
});

test("addKeys writes no r on the nodes of a ref'd subtree that share their parent's ref", () => {
  const { config, context } = keyed();
  const page = config.pages[0];
  expect(entryOf({ context, node: page.blocks })).not.toHaveProperty('r');
  expect(entryOf({ context, node: page.blocks[0] })).not.toHaveProperty('r');
  expect(entryOf({ context, node: page.blocks[0].events.onClick[0] })).not.toHaveProperty('r');
});

test("addKeys writes r where a node's ref differs from its parent's", () => {
  const { config, context } = keyed();
  expect(entryOf({ context, node: config.pages[0].blocks[0].events }).r).toEqual('refEvents');
});

test("addKeys writes r null on a build-created node under a ref'd parent", () => {
  const { config, context } = keyed();
  const title = config.pages[0].blocks[1];
  expect(entryOf({ context, node: title })).toEqual({
    s: '[1:title:Title]',
    p: config.pages[0].blocks['~k'],
    r: null,
  });
  // Its child shares its (absent) ref, so it writes none.
  expect(entryOf({ context, node: title.properties })).toEqual({
    s: '.properties',
    p: title['~k'],
  });
  expect(
    resolveConfigLocation({ configKey: title.properties['~k'], keyMap: context.keyMap, refMap })
  ).toEqual({
    source: 'lowdefy.yaml',
    config: 'root.pages[0:home:Box].blocks[1:title:Title].properties',
  });
});

test('addKeys writes ~ignoreBuildChecks as i', () => {
  const { config, context } = keyed();
  expect(entryOf({ context, node: config.pages[0].blocks[0] }).i).toEqual(['state-refs']);
});

test('addKeys entries resolve to the same source and config as the full shape did', () => {
  const { config, context } = keyed();
  const action = config.pages[0].blocks[0].events.onClick[0];
  expect(
    resolveConfigLocation({ configKey: action['~k'], keyMap: context.keyMap, refMap })
  ).toEqual({
    source: 'events.yaml:2',
    config: 'root.pages[0:home:Box].blocks[0:button:Button].events.onClick[0:go:Link]',
  });
});

test('a second addKeys pass keys only new nodes, with the right p and r', () => {
  const { config, context } = keyed();
  const before = { ...context.keyMap };
  const events = config.pages[0].blocks[0].events;
  events.onMountAsync = [{ id: 'init', type: 'SetState' }];
  events.onClick.push({ '~r': 'refEvents', '~l': 5, id: 'later', type: 'Link' });
  addKeys({ components: config, context });
  const added = Object.keys(context.keyMap).filter((keyId) => !(keyId in before));
  // A new root id, onMountAsync, its item, and the pushed onClick item.
  expect(added).toHaveLength(3);
  Object.keys(before).forEach((keyId) => expect(context.keyMap[keyId]).toEqual(before[keyId]));
  expect(entryOf({ context, node: events.onMountAsync })).toEqual({
    s: '.onMountAsync',
    p: events['~k'],
    r: null,
  });
  expect(entryOf({ context, node: events.onMountAsync[0] })).toEqual({
    s: '[0:init:SetState]',
    p: events.onMountAsync['~k'],
  });
  expect(entryOf({ context, node: events.onClick[1] })).toEqual({
    s: '[1:later:Link]',
    p: events.onClick['~k'],
    l: 5,
  });
});

test('an already-keyed object moved under a new parent passes its own resolved ref down', () => {
  const { config, context } = keyed();
  const button = config.pages[0].blocks[0];
  const title = config.pages[0].blocks[1];
  // A build step moves the keyed events object from the button to the title.
  const events = button.events;
  delete button.events;
  title.events = events;
  events.onBlur = Object.assign([{ id: 'blur', type: 'SetState' }], { '~r': 'refEvents', '~l': 7 });
  events.onFocus = [{ id: 'focus', type: 'SetState' }];
  addKeys({ components: config, context });
  // The events entry still names the button; its ref resolves to refEvents, so
  // a new child from the same file writes no r, and a build-created one r: null.
  expect(entryOf({ context, node: events.onBlur })).toEqual({
    s: '.onBlur',
    p: events['~k'],
    l: 7,
  });
  expect(entryOf({ context, node: events.onFocus })).toEqual({
    s: '.onFocus',
    p: events['~k'],
    r: null,
  });
  expect(resolveKeyEntry({ keyMap: context.keyMap, configKey: events.onBlur['~k'] })).toMatchObject(
    {
      path: 'root.pages[0:home:Box].blocks[0:button:Button].events.onBlur',
      refId: 'refEvents',
    }
  );
});
