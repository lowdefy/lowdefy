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

import loadHtmlDom from './loadHtmlDom.js';
import matchHtmlText from './matchHtmlText.js';

async function match(html, target) {
  const parse = await loadHtmlDom();
  const { elements, uncertain } = matchHtmlText({ root: parse(html), target });
  return { found: elements.map((element) => element.outerHTML), uncertain };
}

test('text matches the shown interactive controls whose whole text it is, trimmed', async () => {
  const html =
    '<button data-event="onOpen"> Open </button><div data-event="onOpen">Open</div><button>Open all</button>';
  expect(await match(html, { text: 'Open' })).toEqual({
    found: ['<button data-event="onOpen"> Open </button>'],
    uncertain: null,
  });
});

test('text reads a popover trigger as the button popoverEnhancer makes it, and a page link as a link', async () => {
  const html =
    '<span data-popover="more">More</span><div data-popover-content="more"><button>Archive</button></div><a data-page-id="home">Home</a>';
  const more = await match(html, { text: 'More' });
  expect(more.found).toHaveLength(1);
  expect(more.found[0]).toContain('role="button"');
  expect((await match(html, { text: 'Home' })).found).toHaveLength(1);
});

test('text and containing skip what the html hides, and popover content until it opens', async () => {
  const html =
    '<button hidden>Save</button><p style="display: none"><button>Save</button></p><div data-popover-content="x"><button>Save</button></div>';
  expect((await match(html, { text: 'Save' })).found).toEqual([]);
  expect((await match(html, { containing: 'Save' })).found).toEqual([]);
});

test('containing matches the innermost elements holding the text, case and whitespace ignored', async () => {
  const html =
    '<div data-event="onPick"><span>Acme   Ltd</span><span>acme@example.com</span></div><div data-event="onPick"><span>Beta Corp</span></div>';
  expect(await match(html, { containing: 'acme ltd' })).toEqual({
    found: ['<span>Acme   Ltd</span>'],
    uncertain: null,
  });
  expect((await match(html, { containing: 'ACME' })).found).toEqual([
    '<span>Acme   Ltd</span>',
    '<span>acme@example.com</span>',
  ]);
});

test('a hidden element that holds the text keeps its parent from matching, as innerText reads it', async () => {
  const html = '<div data-event="onPick">Acme <span hidden>Acme</span></div>';
  expect((await match(html, { containing: 'Acme' })).found).toEqual([]);
});

test('containing reads a button input by its value', async () => {
  const html = '<input type="button" value="Send invite">';
  expect((await match(html, { containing: 'invite' })).found).toHaveLength(1);
  expect((await match(html, { text: 'Send invite' })).found).toHaveLength(1);
});

test('containing whose match depends on layout is uncertain', async () => {
  const html = '<div data-event="onPick"><span>Assigned to</span><b>Jane</b></div>';
  expect((await match(html, { containing: 'Assigned to Jane' })).uncertain).toBe(
    'what matches "Assigned to Jane" depends on how the page lays out its text'
  );
  expect((await match(html, { containing: 'Jane' })).uncertain).toBeNull();
});

test('text across the html top-level elements matches the block itself, which is uncertain', async () => {
  const html = '<span>Acme</span><span> Ltd</span>';
  expect((await match(html, { containing: 'Acme Ltd' })).uncertain).toBe(
    '"Acme Ltd" runs across the html\'s top-level elements, so a browser matches the block itself'
  );
});

test('a match that rests on text an enhancer writes is uncertain', async () => {
  const html =
    '<button data-event="onOpen"><span data-time="2026-01-01">2026-01-01</span></button>';
  expect((await match(html, { containing: '2026-01-01' })).uncertain).toBe(
    'what matches depends on text an html enhancer writes (data-time, data-format, data-avatar, data-icon or data-copy)'
  );
  expect(
    (
      await match(
        '<button data-event="onOpen">Open <span data-time="2026-01-01"></span></button>',
        {
          containing: 'Open',
        }
      )
    ).uncertain
  ).toBeNull();
});

test('text and containing never read a script or style', async () => {
  const html = '<button>Go<style>.x { content: "Stop"; }</style></button>';
  expect((await match(html, { text: 'Go' })).found).toHaveLength(1);
  expect((await match(html, { containing: 'Stop' })).found).toEqual([]);
});
