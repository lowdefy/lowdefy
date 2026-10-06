/**
 * @jest-environment jsdom
 */
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

import { resolveTargetInDocument, targetFixtures } from '@lowdefy/e2e-utils/targets';

import getTrace from './getTrace.js';

const TARGET_FIELDS = ['block_id', 'row', 'column', 'text', 'nth', 'option'];

function targetFields(target) {
  return Object.fromEntries(TARGET_FIELDS.map((field) => [field, target[field]]));
}

function createLowdefy() {
  return { basePath: '', contexts: {}, home: {} };
}

function select(selector) {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new Error(`Fixture selector "${selector}" matched nothing.`);
  }
  return element;
}

afterEach(() => {
  document.body.innerHTML = '';
  window.history.replaceState({}, '', '/');
});

describe.each(targetFixtures.map((fixture) => [fixture.name, fixture]))(
  'describeElement fixture: %s',
  (name, fixture) => {
    const { describeElement } = getTrace(createLowdefy());

    beforeEach(() => {
      document.body.innerHTML = fixture.html;
    });

    test('the element describes as the canonical target', () => {
      const described = describeElement(select(fixture.element));
      expect(targetFields(described)).toEqual(targetFields(fixture.target));
      expect(described.block_ids).toEqual(fixture.blockIds);
    });

    test('the element a click lands on describes as the same target', () => {
      const described = describeElement(select(fixture.clicked ?? fixture.element));
      expect(targetFields(described)).toEqual(targetFields(fixture.target));
      expect(described.block_ids).toEqual(fixture.blockIds);
    });

    if (fixture.resolvable) {
      test('the canonical target resolves to the element and describes back to itself', () => {
        const element = resolveTargetInDocument({ document, target: fixture.target });
        expect(element).toBe(select(fixture.element));
        expect(targetFields(describeElement(element))).toEqual(targetFields(fixture.target));
      });

      test('every runner target resolves to the same element after describing it', () => {
        [fixture.target, ...fixture.variants].forEach((target) => {
          const element = resolveTargetInDocument({ document, target });
          expect(element).toBe(select(fixture.element));
          const described = describeElement(element);
          expect(resolveTargetInDocument({ document, target: described })).toBe(element);
        });
      });
    }
  }
);

test('describeElement reads the block type from the context of the page the URL shows', () => {
  const lowdefy = createLowdefy();
  lowdefy.contexts.orders = {
    pageId: 'orders',
    _internal: { RootSlots: { map: { save_button: { type: 'Button' } } } },
  };
  document.body.innerHTML = targetFixtures[0].html;
  window.history.replaceState({}, '', '/orders');
  const described = getTrace(lowdefy).describeElement(select('#bl-save_button button'));
  expect(described.page_id).toBe('orders');
  expect(described.block_type).toBe('Button');
});

test('describeElement falls back to the app context for the block type', () => {
  const lowdefy = createLowdefy();
  lowdefy.appContext = {
    pageId: undefined,
    _internal: { RootSlots: { map: { save_button: { type: 'Button' } } } },
  };
  document.body.innerHTML = targetFixtures[0].html;
  window.history.replaceState({}, '', '/orders');
  expect(getTrace(lowdefy).describeElement(select('#bl-save_button button')).block_type).toBe(
    'Button'
  );
});

test('describeElement gives a null block type for a block it cannot find', () => {
  document.body.innerHTML = targetFixtures[0].html;
  expect(
    getTrace(createLowdefy()).describeElement(select('#bl-save_button button')).block_type
  ).toBeNull();
});

test('describeElement skips hidden controls when it counts controls with the same text', () => {
  document.body.innerHTML = `
<div id="bl-tabs">
  <div class="pane" data-hidden="true"><button>Edit</button></div>
  <div class="pane"><button>Edit</button></div>
</div>`;
  const prototype = window.Element.prototype;
  prototype.checkVisibility = function checkVisibility() {
    return this.closest('[data-hidden="true"]') === null;
  };
  prototype.getBoundingClientRect = () => ({ height: 10, width: 10 });
  try {
    const visible = document.querySelectorAll('button')[1];
    expect(getTrace(createLowdefy()).describeElement(visible)).toMatchObject({
      block_id: 'tabs',
      text: 'Edit',
      nth: null,
    });
  } finally {
    delete prototype.checkVisibility;
    delete prototype.getBoundingClientRect;
  }
});

test('describeChain parses the chain and adds the page id and block type', () => {
  const lowdefy = createLowdefy();
  lowdefy.contexts.orders = {
    pageId: 'orders',
    _internal: { RootSlots: { map: { save_button: { type: 'Button' } } } },
  };
  window.history.replaceState({}, '', '/orders');
  const chain =
    'span:nth-child="1"nth-of-type="1"text="Save";button:nth-child="1"nth-of-type="1"text="Save";div:attr__id="bl-save_button"attr_id="bl-save_button"nth-child="1"nth-of-type="1"';
  expect(getTrace(lowdefy).describeChain(chain)).toEqual({
    page_id: 'orders',
    block_id: 'save_button',
    block_type: 'Button',
    row: null,
    column: null,
    text: 'Save',
    nth: null,
    option: false,
    block_ids: ['save_button'],
  });
});

test('pageIdOf strips the basePath', () => {
  const lowdefy = { ...createLowdefy(), basePath: '/app' };
  expect(getTrace(lowdefy).pageIdOf('https://example.com/app/orders/list?x=1')).toBe('orders/list');
});

test('pageIdOf gives the configured home page at the app root', () => {
  const lowdefy = {
    ...createLowdefy(),
    basePath: '/app',
    home: { configured: true, pageId: 'home' },
  };
  expect(getTrace(lowdefy).pageIdOf('https://example.com/app/')).toBe('home');
  expect(getTrace(lowdefy).pageIdOf('https://example.com/app')).toBe('home');
});

test('pageIdOf gives null at the app root without a configured home page', () => {
  const lowdefy = { ...createLowdefy(), home: { configured: false, pageId: 'first' } };
  expect(getTrace(lowdefy).pageIdOf('https://example.com/')).toBeNull();
});

test('pageIdOf works before the client initialises lowdefy', () => {
  expect(getTrace({}).pageIdOf('https://example.com/orders')).toBe('orders');
  expect(getTrace({}).pageIdOf('https://example.com/')).toBeNull();
});

test('a text target with no nth resolves to nothing when several controls match, as the runner refuses it', () => {
  document.body.innerHTML = `
<div id="bl-toolbar">
  <button type="button"><span>Delete</span></button>
  <button type="button"><span>Delete</span></button>
</div>`;
  expect(
    resolveTargetInDocument({ document, target: { block_id: 'toolbar', text: 'Delete' } })
  ).toBeNull();
  expect(resolveTargetInDocument({ document, target: { text: 'Delete' } })).toBeNull();
  expect(
    resolveTargetInDocument({ document, target: { block_id: 'toolbar', text: 'Delete', nth: 1 } })
  ).toBe(select('#bl-toolbar button:nth-of-type(2)'));
});

test('describeElement gives nth null for a control that is the only match in its scope', () => {
  document.body.innerHTML = `
<div id="bl-toolbar">
  <button type="button"><span>Save</span></button>
  <button type="button"><span>Delete</span></button>
</div>`;
  const { describeElement } = getTrace(createLowdefy());
  expect(describeElement(select('#bl-toolbar button:nth-of-type(1)')).nth).toBeNull();
  expect(describeElement(select('#bl-toolbar button:nth-of-type(2)')).nth).toBeNull();
});
