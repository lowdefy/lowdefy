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

import validateJourney from './validateJourney.js';

const minimalJourney = { name: 'a journey', pageId: 'controls', steps: [{ click: 'submit' }] };

test('validateJourney accepts a minimal journey', () => {
  expect(validateJourney({ journey: minimalJourney })).toEqual({ valid: true });
});

test('validateJourney accepts every step of the grammar, a user name and urlQuery', () => {
  const journey = {
    name: 'full',
    pageId: 'controls',
    user: 'admin',
    urlQuery: { status: 'open' },
    steps: [
      { click: 'submit' },
      { fill: { blockId: 'title', value: 'Access reviews' } },
      { set: { blockId: 'rating', value: 4 } },
      { select: { blockId: 'country', value: 'Chile' } },
      { press: 'Mod+k' },
      { press: { blockId: 'title', key: 'Enter' } },
      { wait: { ms: 10 } },
      { wait: { request: 'get_controls' } },
      { wait: { state: 'controls' } },
      { screenshot: 'after' },
      { screenshot: null },
      { expect: { state: { path: 'saved', equals: true } } },
      { expect: { visible: 'modal' } },
      { expect: { text: { blockId: 'title', contains: 'Access' } } },
      { expect: { text: { blockId: 'title', equals: 'Access reviews' } } },
      { expect: { text: { blockId: 'title', notContains: 'Deleted' } } },
      { expect: { url: { contains: '/detail' } } },
      { expect: { dom: { blockId: 'submit', hasClass: 'ant-btn-primary' } } },
      { expect: { dom: { blockId: 'submit', notHasClass: 'ant-btn-disabled' } } },
      { expect: { dom: { blockId: 'total', matches: 'span.amount' } } },
      { expect: { dom: { blockId: 'total', attribute: 'aria-disabled', equals: 'true' } } },
      { expect: { durationMsUnder: 2000 } },
    ],
  };
  expect(validateJourney({ journey })).toEqual({ valid: true });
  expect(
    validateJourney({ journey: { ...journey, user: { sub: 'u1', roles: ['admin'] } } })
  ).toEqual({ valid: true });
});

test('validateJourney rejects a journey that is not an object', () => {
  expect(validateJourney({ journey: 'not a journey' })).toEqual({
    valid: false,
    message: 'Journey should be an object. Received "not a journey".',
  });
});

test('validateJourney rejects a typo in a top level key instead of ignoring it', () => {
  expect(validateJourney({ journey: { ...minimalJourney, pageID: 'controls' } })).toEqual({
    valid: false,
    message:
      'Journey has unknown key "pageID". Journey keys are: fixtures, name, pageId, steps, urlQuery, user.',
  });
});

test('validateJourney rejects a missing name and a non-string pageId', () => {
  expect(validateJourney({ journey: { pageId: 'p', steps: [{ click: 'a' }] } })).toEqual({
    valid: false,
    message: 'Journey should have required property "name".',
  });
  expect(validateJourney({ journey: { name: 'n', pageId: 2, steps: [{ click: 'a' }] } })).toEqual({
    valid: false,
    message: 'Journey "pageId" should be a string. Received 2.',
  });
});

test('validateJourney rejects a journey without steps and an empty steps list', () => {
  expect(validateJourney({ journey: { name: 'n', pageId: 'p' } })).toEqual({
    valid: false,
    message: 'Journey should have required property "steps".',
  });
  expect(validateJourney({ journey: { ...minimalJourney, steps: [] } })).toEqual({
    valid: false,
    message: 'Journey "steps" should have at least one step.',
  });
});

test('validateJourney rejects a user and a urlQuery of the wrong type', () => {
  expect(validateJourney({ journey: { ...minimalJourney, user: 5 } }).message).toEqual(
    'Journey "user" should be a dev user name (string) or an inline user object. Received 5.'
  );
  expect(
    validateJourney({ journey: { ...minimalJourney, urlQuery: 'status=open' } }).message
  ).toEqual('Journey "urlQuery" should be an object. Received "status=open".');
});

test('validateJourney reports a step malformed below the key level with its index', () => {
  expect(validateJourney({ journey: { ...minimalJourney, steps: [{ fill: 'title' }] } })).toEqual({
    valid: false,
    message: 'Step 0 "fill" requires { blockId, value }. Received "title".',
  });
});

test('validateJourney accepts a fixtures list of names', () => {
  expect(
    validateJourney({
      journey: { name: 'j', pageId: 'p', fixtures: ['base', 'org-a'], steps: [{ click: 'a' }] },
    })
  ).toEqual({ valid: true });
});

test('validateJourney rejects fixtures that are not a list of names', () => {
  expect(
    validateJourney({
      journey: { name: 'j', pageId: 'p', fixtures: 'base', steps: [{ click: 'a' }] },
    })
  ).toEqual({
    valid: false,
    message: 'Journey "fixtures" should be an array of fixture names. Received "base".',
  });
  expect(
    validateJourney({ journey: { name: 'j', pageId: 'p', fixtures: [1], steps: [{ click: 'a' }] } })
  ).toEqual({
    valid: false,
    message: 'Journey "fixtures" should be an array of fixture names. Received [1].',
  });
});
