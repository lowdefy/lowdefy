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

import pageContextExpression from './instanceKey.js';

// The expression runs in the browser; here it is evaluated against a window holding what the
// client sets on window.lowdefy.
function readContext({ pathname, lowdefy }) {
  global.window = { location: { pathname }, lowdefy };
  try {
    return new Function(`return ${pageContextExpression}`)();
  } finally {
    delete global.window;
  }
}

function ticketLowdefy({ basePath } = {}) {
  return {
    basePath,
    home: { configured: true, pageId: 'home' },
    pathMemory: new Map([
      [
        'tickets/1',
        { pageId: 'ticket', pathParams: { id: '1' }, instanceKey: 'page:ticket#tickets/1' },
      ],
      [
        'tickets/2',
        { pageId: 'ticket', pathParams: { id: '2' }, instanceKey: 'page:ticket#tickets/2' },
      ],
    ]),
    contexts: {
      'page:home': { id: 'home' },
      'page:about': { id: 'about' },
      'page:ticket#tickets/1': { id: 'ticket 1' },
      'page:ticket#tickets/2': { id: 'ticket 2' },
    },
  };
}

test('pageContextExpression reads the instance the path memory maps the URL path to', () => {
  const lowdefy = ticketLowdefy();
  expect(readContext({ pathname: '/tickets/1', lowdefy })).toEqual({ id: 'ticket 1' });
  expect(readContext({ pathname: '/tickets/2', lowdefy })).toEqual({ id: 'ticket 2' });
});

test('pageContextExpression strips the basePath and one trailing slash', () => {
  const lowdefy = ticketLowdefy({ basePath: '/app' });
  expect(readContext({ pathname: '/app/tickets/2/', lowdefy })).toEqual({ id: 'ticket 2' });
});

test('pageContextExpression reads a path the memory has not seen as a page id', () => {
  expect(readContext({ pathname: '/about', lowdefy: ticketLowdefy() })).toEqual({ id: 'about' });
});

test('pageContextExpression reads the app root as the home page', () => {
  expect(readContext({ pathname: '/', lowdefy: ticketLowdefy() })).toEqual({ id: 'home' });
});

test('pageContextExpression is undefined before the client sets window.lowdefy', () => {
  expect(readContext({ pathname: '/tickets/1', lowdefy: undefined })).toBeUndefined();
});
