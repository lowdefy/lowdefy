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

import getJourneyTouches from './getJourneyTouches.js';

test('getJourneyTouches maps click to onClick and fill, set and select to onChange', () => {
  const journey = {
    name: 'sign in',
    pageId: 'login',
    steps: [
      { fill: { blockId: 'email', value: 'a@b.c' } },
      { set: { blockId: 'remember', value: true } },
      { select: { blockId: 'tenant', value: 'acme' } },
      { click: 'submit' },
    ],
  };
  expect(getJourneyTouches({ journey }).touches).toEqual([
    { pageId: 'login', blockId: 'email', event: 'onChange' },
    { pageId: 'login', blockId: 'remember', event: 'onChange' },
    { pageId: 'login', blockId: 'tenant', event: 'onChange' },
    { pageId: 'login', blockId: 'submit', event: 'onClick' },
  ]);
});

test('getJourneyTouches maps a press of Enter on a block to onEnter and onKeyDown', () => {
  const journey = {
    pageId: 'search',
    steps: [{ press: { blockId: 'query', key: 'Enter' } }],
  };
  expect(getJourneyTouches({ journey }).touches).toEqual([
    { pageId: 'search', blockId: 'query', event: 'onEnter' },
    { pageId: 'search', blockId: 'query', event: 'onKeyDown' },
  ]);
});

test('getJourneyTouches maps a press of another key on a block to onKeyDown only', () => {
  const journey = { pageId: 'search', steps: [{ press: { blockId: 'query', key: 'Mod+k' } }] };
  expect(getJourneyTouches({ journey }).touches).toEqual([
    { pageId: 'search', blockId: 'query', event: 'onKeyDown' },
  ]);
});

test('getJourneyTouches ignores a page level press, which names no block', () => {
  const journey = { pageId: 'search', steps: [{ press: 'Enter' }] };
  expect(getJourneyTouches({ journey }).touches).toEqual([]);
});

test('getJourneyTouches collects the request ids a journey waits on', () => {
  const journey = {
    pageId: 'users',
    steps: [{ wait: { request: 'get_users' } }, { wait: { ms: 100 } }, { screenshot: 'after' }],
  };
  expect(getJourneyTouches({ journey })).toEqual({
    pageId: 'users',
    requestIds: ['get_users'],
    touches: [],
  });
});

test('getJourneyTouches returns nothing for a journey with no pageId or no steps', () => {
  expect(getJourneyTouches({ journey: { steps: [{ click: 'x' }] } })).toEqual({
    pageId: undefined,
    requestIds: [],
    touches: [],
  });
  expect(getJourneyTouches({ journey: { pageId: 'home' } })).toEqual({
    pageId: 'home',
    requestIds: [],
    touches: [],
  });
});
