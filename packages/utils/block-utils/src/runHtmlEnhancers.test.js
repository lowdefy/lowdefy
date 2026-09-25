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

import { jest } from '@jest/globals';

import createHtmlEnhancerGate from './createHtmlEnhancerGate.js';
import HTML_ENHANCERS from './htmlEnhancers/htmlEnhancers.js';
import runHtmlEnhancers from './runHtmlEnhancers.js';

function createRoot(html) {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

test('runHtmlEnhancers runs prepare in order and collects portals, cleanups and data by name', () => {
  const calls = [];
  const cleanup = jest.fn();
  const enhancers = [
    {
      name: 'first',
      attributes: ['data-first'],
      prepare: () => {
        calls.push('first');
        return { portals: [{ key: 'a' }], cleanup, value: 1 };
      },
    },
    { name: 'nothing', attributes: ['data-nothing'] },
    {
      name: 'second',
      attributes: ['data-second'],
      prepare: ({ dataEvents, registration }) => {
        calls.push(['second', dataEvents, registration]);
      },
    },
  ];
  const result = runHtmlEnhancers({
    dataEvents: true,
    enhancers,
    registration: 'reg',
    root: createRoot('<b>x</b>'),
  });
  expect(calls).toEqual(['first', ['second', true, 'reg']]);
  expect(result.portals).toEqual([{ key: 'first:a' }]);
  expect(result.cleanups).toEqual([cleanup]);
  expect(result.prepared).toEqual({ first: { value: 1 }, second: {} });
});

test('runHtmlEnhancers select skips elements inside popover content', () => {
  let selected;
  runHtmlEnhancers({
    enhancers: [
      {
        name: 'probe',
        attributes: ['data-x'],
        prepare: ({ select }) => {
          selected = select('[data-x]').map((element) => element.id);
        },
      },
    ],
    root: createRoot(
      '<i id="a" data-x></i><div data-popover-content="p" hidden><i id="b" data-x></i></div>'
    ),
  });
  expect(selected).toEqual(['a']);
});

test('the enhancer gate matches whole attribute names only', () => {
  const gate = createHtmlEnhancerGate(HTML_ENHANCERS);
  expect(gate.test('<i data-icon="edit"></i>')).toBe(true);
  expect(gate.test('<div data-popover-content="x"></div>')).toBe(true);
  expect(gate.test('<a data-page-id="home">h</a>')).toBe(true);
  expect(gate.test('<i DATA-ICON="edit"></i>')).toBe(true);
  expect(gate.test('<span data-testid="cell">x</span>')).toBe(false);
  expect(gate.test('<span data-linked-id="1">x</span>')).toBe(false);
  expect(gate.test('<span data-icons="1">x</span>')).toBe(false);
  expect(gate.test('<span xdata-icon="1">x</span>')).toBe(false);
});
