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

import loadHtmlDom from '../standIns/loadHtmlDom.js';
import readHtmlPieces, { runShows } from './readHtmlPieces.js';

async function read(html, options) {
  const parse = await loadHtmlDom();
  return readHtmlPieces({ root: parse(html), ...options });
}

function texts({ runs }) {
  return runs.map(({ text }) => text);
}

test('readHtmlPieces joins text across inline elements and breaks it at block elements', async () => {
  expect(texts(await read('<p><b>Acme</b> Ltd</p><p>3<br>contacts</p>'))).toEqual([
    'Acme Ltd',
    '3',
    'contacts',
  ]);
});

test('readHtmlPieces breaks the children of a flex box and inline elements laid out by class', async () => {
  expect(
    texts(await read('<div style="display: flex"><span>Acme</span><span>Ltd</span></div>'))
  ).toEqual(['Acme', 'Ltd']);
  expect(texts(await read('<span>Acme</span><span class="md:block">Ltd</span>'))).toEqual([
    'Acme',
    'Ltd',
  ]);
  expect(texts(await read('<span data-status="green">Live</span>'))).toEqual(['Live']);
});

test('readHtmlPieces leaves out of its runs text that may not show as written', async () => {
  const reading = await read(
    '<p>Shown</p><p hidden>Gone</p><p class="hidden">Maybe</p><p class="uppercase">case</p><div data-popover-content="x">Later</div><input type="submit" value="Go">'
  );
  expect(texts(reading)).toEqual(['Shown']);
  expect(reading.units).toEqual(['shownmaybecaselater', 'showncase']);
  expect(reading.open).toBe(null);
});

test('readHtmlPieces says which text an html enhancer writes', async () => {
  const reading = await read('Seen <span data-format="currency">10</span>');
  expect(texts(reading)).toEqual(['Seen ']);
  expect(reading.open).toContain('an html enhancer writes some of its text');
});

test('runShows collapses white space where a browser does, and keeps it in a pre run', () => {
  const collapsed = { text: 'Acme\n   Ltd', pre: false };
  expect(runShows({ run: collapsed, contains: 'Acme Ltd' })).toBe(true);
  expect(runShows({ run: collapsed, contains: 'Acme  Ltd' })).toBe(false);
  expect(runShows({ run: collapsed, contains: 'Ltd ' })).toBe(false);
  const kept = { text: 'Acme\n   Ltd', pre: true };
  expect(runShows({ run: kept, contains: 'Acme Ltd' })).toBe(false);
  expect(runShows({ run: kept, contains: 'Acme\n   Ltd' })).toBe(true);
});
