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

import findOnPathCopy from './findOnPathCopy.js';

function exercised({ rendered }) {
  return { pages: Object.keys(rendered), requests: [], endpoints: [], events: [], rendered };
}

const tickets = {
  artifact: 'pages/tickets.json',
  key: 'k_tickets',
  anchor: { type: 'block', pageId: 'tickets', blockId: 'footer', parentBlockId: 'tickets' },
};

const footer = {
  id: 'footer',
  operator: 'drop-block',
  artifact: 'pages/a-home.json',
  key: 'k_home',
  anchor: { type: 'block', pageId: 'a-home', blockId: 'footer', parentBlockId: 'a-home' },
  copies: ['tickets'],
  copyTargets: [tickets],
};

test('findOnPathCopy gives the copy on the page the journey rendered the block on', () => {
  expect(
    findOnPathCopy({ mutant: footer, exercised: exercised({ rendered: { tickets: ['footer'] } }) })
  ).toEqual(tickets);
});

test('findOnPathCopy gives the kept copy first when the journey reached several', () => {
  expect(
    findOnPathCopy({
      mutant: footer,
      exercised: exercised({ rendered: { tickets: ['footer'], 'a-home': ['footer'] } }),
    })
  ).toEqual({ artifact: 'pages/a-home.json', key: 'k_home', anchor: footer.anchor });
});

test('findOnPathCopy gives undefined when the journey reached no copy', () => {
  expect(
    findOnPathCopy({ mutant: footer, exercised: exercised({ rendered: { settings: ['footer'] } }) })
  ).toBeUndefined();
});
