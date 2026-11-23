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

import { expect, test } from 'vitest';

import listHtmlTextMatches from './listHtmlTextMatches.js';
import loadHtmlDom from './loadHtmlDom.js';

const dataEvents = ['onOpen', { name: 'onRemove', confirm: 'Remove it?' }];

function block(html) {
  return { blockId: 'rows', type: 'ClickableHtml', eval: { properties: { dataEvents, html } } };
}

async function list({ confirm = null, html, i18n, overlays = true, popover = null, target }) {
  const parse = await loadHtmlDom();
  return listHtmlTextMatches({
    block: block(html),
    confirm,
    html,
    i18n,
    overlays,
    parse,
    popover,
    target,
  });
}

function actions(matches) {
  return matches.map(({ where, action, description }) => ({
    where,
    kind: action.kind,
    description,
  }));
}

test('a match in a listed data-event element fires it with its data-* event object', async () => {
  const { matches } = await list({
    html: '<div data-event="onOpen" data-id="7" data-tone="high"><span>Acme</span></div>',
    target: { containing: 'Acme' },
  });
  expect(matches).toHaveLength(1);
  expect(matches[0].action).toEqual({
    kind: 'event',
    dataEvent: { name: 'onOpen', event: { id: '7', tone: 'high' } },
    confirm: false,
    message: null,
    control: { control: 'onOpen', rowKey: '7' },
  });
  expect(matches[0].description).toBe('data-event "onOpen" (data-id "7")');
});

test('an event the block does not list fires nothing; a confirm asks with its message', async () => {
  const { matches } = await list({
    html: '<button data-event="onDrop">Drop</button><button data-event="onRemove">Remove</button>',
    target: { containing: 'o' },
  });
  expect(actions(matches)).toEqual([
    { where: 'html', kind: 'none', description: 'a <button> showing "Drop"' },
    { where: 'html', kind: 'event', description: 'data-event "onRemove"' },
  ]);
  expect(matches[1].action).toMatchObject({ confirm: true, message: 'Remove it?' });
});

test("a popover trigger opens its popover; a link, a copy button or a nested trigger is the browser's", async () => {
  const opens = await list({
    html: '<span data-popover="more">More</span>',
    target: { text: 'More' },
  });
  expect(opens.matches[0].action.kind).toBe('popover');
  const link = await list({
    html: '<a href="/x"><span>Docs</span></a>',
    target: { containing: 'Docs' },
  });
  expect(link.matches[0].action).toEqual({
    kind: 'browser',
    reason: 'it is in a link, which a browser follows',
  });
  const nested = await list({
    html: '<p>x</p>',
    popover: '<span data-popover="deeper">Deeper</span>',
    target: { text: 'Deeper' },
  });
  expect(nested.matches[0]).toMatchObject({
    where: 'popover',
    action: { kind: 'browser', reason: 'it opens a popover inside a popover' },
  });
});

test("a disabled control is refused, and an element inside one is the browser's", async () => {
  const { matches } = await list({
    html: '<button data-event="onOpen" disabled>Open</button><button disabled><span>Close</span></button>',
    target: { containing: 'o' },
  });
  expect(matches.map(({ action }) => action.kind)).toEqual(['disabled', 'browser']);
});

test('with overlays, the open popover and confirm count after the html; scoped to the block, they do not', async () => {
  const html = '<button data-event="onOpen">Open</button>';
  const popover = '<button data-event="onOpen" data-id="p">Open</button>';
  const confirm = { message: 'Open them all?' };
  const page = await list({ confirm, html, popover, target: { containing: 'open' } });
  expect(actions(page.matches)).toEqual([
    { where: 'html', kind: 'event', description: 'data-event "onOpen"' },
    { where: 'popover', kind: 'event', description: 'data-event "onOpen" (data-id "p")' },
    { where: 'confirm', kind: 'none', description: "the confirm's message" },
  ]);
  const scoped = await list({ confirm, html, overlays: false, popover, target: { text: 'Open' } });
  expect(scoped.matches).toHaveLength(1);
});

test("a text target names the open confirm's OK or Cancel by antd's en_US labels", async () => {
  const ok = await list({ confirm: { message: 'Sure?' }, html: '', target: { text: 'OK' } });
  expect(ok.matches.map(({ action }) => action)).toEqual([{ kind: 'confirm', control: 'ok' }]);
  const localised = await list({
    confirm: { message: 'Sure?' },
    html: '',
    i18n: { locales: [{ code: 'af' }] },
    target: { text: 'OK' },
  });
  expect(localised).toEqual({
    matches: [],
    uncertain: 'the open confirm labels its buttons in the app locale',
    layered: false,
  });
  const untold = await list({ confirm: { message: null }, html: '', target: { containing: 'x' } });
  expect(untold.uncertain).toBe('the open confirm shows text in the app locale');
});
