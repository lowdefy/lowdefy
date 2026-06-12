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

// S3c gate: page modules emit parse roots as closures; evaluating a closure
// root THROUGH WebParser.parse (the adapter) must match parsing the data
// root — output and errors, including arrayIndices-applied locations.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyArrayIndices, get } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';
import { WebParser } from '@lowdefy/operators';

import emitPageModule from './emitPageModule.js';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tmpRoot = path.join(pkgRoot, '.tmp-page-closures');

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

const operators = {
  _state: ({ params, state, arrayIndices }) =>
    get(state, applyArrayIndices(arrayIndices, params), { default: null }),
  _sum: ({ params }) => params.reduce((a, b) => a + b, 0),
  _event: ({ params, event }) => get(event ?? {}, params, { default: null }),
  _boom: () => {
    throw new Error('boom');
  },
  _cfg: () => {
    throw new ConfigError('bad config');
  },
};

function makeParser() {
  const context = {
    id: 'ctx1',
    eventLog: [],
    jsMap: {},
    requests: {},
    state: { name: 'Ada', rows: [{ v: 1 }, { v: 2 }] },
    _internal: {
      lowdefy: {
        apiResponses: {},
        basePath: '',
        home: { pageId: 'home' },
        i18n: undefined,
        inputs: { ctx1: {} },
        lowdefyApp: {},
        lowdefyGlobal: {},
        menus: [],
        pageId: 'p1',
        theme: {},
        user: {},
        _internal: { globals: {} },
      },
    },
  };
  return new WebParser({ context, operators });
}

const page = {
  id: 'page:p1',
  pageId: 'p1',
  blockId: 'p1',
  type: 'Box',
  properties: { title: { _state: 'name' }, '~k': 'k:props' },
  visible: { _sum: [1, 1] },
  style: { color: 'red' },
  events: {
    onClick: {
      try: [
        {
          id: 'a1',
          type: 'SetState',
          '~k': 'k:a1',
          skip: { _sum: [0, 0] },
          params: { value: { _event: 'x' } },
          messages: { loading: { _state: 'name' } },
        },
        { id: 'a2', type: 'Reset', params: { static: true } },
      ],
      catch: [],
    },
  },
  requests: [{ requestId: 'r1', '~k': 'k:r1', payload: { q: { _state: 'rows.$.v' } } }],
  slots: {
    content: {
      blocks: [
        {
          id: 'inner',
          blockId: 'inner',
          type: 'List',
          properties: { row: { _state: 'rows.$.v' }, '~k': 'k:inner' },
        },
      ],
    },
  },
};

async function importPageModule(input) {
  const { code } = emitPageModule({ page: input, operators });
  fs.mkdirSync(tmpRoot, { recursive: true });
  const file = path.join(tmpRoot, `page-${Math.abs(hashCode(code))}.mjs`);
  fs.writeFileSync(file, code);
  return (await import(`${file}?v=1`)).default;
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function errorProfile(e) {
  return {
    name: e.constructor.name,
    message: e.message,
    typeName: e.typeName ?? null,
    received: e.received ?? null,
    location: e.location ?? null,
    configKey: e.configKey ?? null,
  };
}

function expectRootParity({ parser, dataRoot, closureRoot, location, arrayIndices, event }) {
  const a = parser.parse({ input: dataRoot, location, arrayIndices, event });
  const b = parser.parse({ input: closureRoot, location, arrayIndices, event });
  expect(b.output).toEqual(a.output);
  expect(b.errors.map(errorProfile)).toEqual(a.errors.map(errorProfile));
}

test('closure parse roots match data roots through WebParser.parse', async () => {
  const factory = await importPageModule(page);
  const modPage = factory();
  const parser = makeParser();

  expect(typeof modPage.properties).toBe('function');
  expect(typeof modPage.visible).toBe('function');
  // Pure-data roots stay data.
  expect(typeof modPage.style).toBe('object');

  expectRootParity({
    parser,
    dataRoot: page.properties,
    closureRoot: modPage.properties,
    location: 'p1',
    arrayIndices: [],
  });
  expectRootParity({
    parser,
    dataRoot: page.visible,
    closureRoot: modPage.visible,
    location: 'p1',
    arrayIndices: [],
  });
});

test('list blocks evaluate per arrayIndices, locations index-applied', async () => {
  const factory = await importPageModule(page);
  const modPage = factory();
  const parser = makeParser();
  const inner = modPage.slots.content.blocks[0];
  expect(typeof inner.properties).toBe('function');
  for (const arrayIndices of [[0], [1]]) {
    expectRootParity({
      parser,
      dataRoot: page.slots.content.blocks[0].properties,
      closureRoot: inner.properties,
      location: 'inner.$',
      arrayIndices,
    });
  }
});

test('actions are callable closures carrying engine pre-read statics', async () => {
  const factory = await importPageModule(page);
  const modPage = factory();
  const parser = makeParser();
  const action = modPage.events.onClick.try[0];
  expect(typeof action).toBe('function');
  expect(action.id).toBe('a1');
  expect(action.type).toBe('SetState');
  expect(action['~k']).toBe('k:a1');
  expect(action.messages).toEqual({ loading: { _state: 'name' } });

  expectRootParity({
    parser,
    dataRoot: page.events.onClick.try[0],
    closureRoot: action,
    location: 'p1',
    arrayIndices: [],
    event: { x: 42 },
  });
  // Operator-free actions stay data.
  expect(typeof modPage.events.onClick.try[1]).toBe('object');
});

test('request payload closures match, errors collected with applied locations', async () => {
  const factory = await importPageModule(page);
  const modPage = factory();
  const parser = makeParser();
  expect(typeof modPage.requests[0].payload).toBe('function');
  expectRootParity({
    parser,
    dataRoot: page.requests[0].payload,
    closureRoot: modPage.requests[0].payload,
    location: 'r1',
    arrayIndices: [1],
  });

  const errorPage = {
    pageId: 'p1',
    blockId: 'p1',
    type: 'Box',
    properties: { a: { _boom: { in: { _state: 'name' } }, '~k': 'k:x' }, b: { _cfg: 1 } },
  };
  // Hidden ~k on the operator node for configKey parity.
  Object.defineProperty(errorPage.properties.a, '~k', {
    value: 'k:site',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const errFactory = await importPageModule(errorPage);
  const errPage = errFactory();
  expectRootParity({
    parser,
    dataRoot: errorPage.properties,
    closureRoot: errPage.properties,
    location: 'p1',
    arrayIndices: [3],
  });
});

test('the module returns fresh data trees per call, auth stripped', async () => {
  const withAuth = { ...page, auth: { public: true } };
  const factory = await importPageModule(withAuth);
  const one = factory();
  const two = factory();
  expect(one).not.toBe(two);
  expect(one.style).not.toBe(two.style);
  expect(one.auth).toBeUndefined();
});
