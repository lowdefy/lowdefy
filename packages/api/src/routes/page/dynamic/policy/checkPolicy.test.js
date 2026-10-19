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

import { serializer } from '@lowdefy/helpers';

import checkPolicy from './checkPolicy.js';

const policy = {
  id: 'form',
  blocks: ['Box', 'TextInput', 'Paragraph', 'Anchor', 'Img'],
  actions: ['SetState', 'CallAPI', 'Link', 'Request'],
  operators: ['_state', '_if'],
  endpoints: ['submit'],
  requests: ['load'],
  links: { pages: ['thanks'], origins: ['https://example.com'] },
  state: 'form',
  html: false,
  limits: { depth: 3, blocks: 10, bytes: 100000, actionsPerEvent: 2 },
};

const blockMetas = { TextInput: { valueType: 'string' }, Box: { valueType: null } };
const blockSchemas = {
  TextInput: {
    properties: {
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: { title: { type: 'string' } },
      },
    },
  },
};

const routes = [
  { pageId: 'thanks', path: 'thanks' },
  { pageId: 'admin', path: 'admin' },
];

function check(blocks, overrides = {}) {
  return checkPolicy({
    routes,
    blocks,
    policy: { ...policy, ...overrides },
    blockMetas,
    blockSchemas,
  });
}

const wideEvents = { limits: { ...policy.limits, actionsPerEvent: 10 } };

function rules(errors) {
  return errors.map(({ path, rule }) => `${rule} ${path}`);
}

test('checkPolicy passes content that uses only what the policy allows', () => {
  const errors = check([
    {
      id: 'box',
      type: 'Box',
      style: { color: 'red' },
      blocks: [
        {
          id: 'form.name',
          type: 'TextInput',
          properties: { title: 'Name' },
          visible: { _if: { test: { _state: 'form.show' }, then: true, else: false } },
          events: {
            onChange: [
              { id: 'set', type: 'SetState', params: { 'form.touched': true } },
              { id: 'save', type: 'CallAPI', params: { endpointId: 'submit' } },
            ],
          },
        },
        { id: 'go', type: 'Anchor', properties: { pageId: 'thanks', href: '/thanks' } },
        { id: 'pic', type: 'Img', properties: { src: 'https://example.com/a.png' } },
      ],
    },
  ]);
  expect(errors).toEqual([]);
});

test('checkPolicy reports block, action and operator types the policy does not list', () => {
  const errors = check([
    {
      id: 'x',
      type: 'DangerousHtml',
      properties: { html: { _global: 'token' } },
      events: { onMount: [{ id: 'out', type: 'Logout' }] },
    },
  ]);
  expect(rules(errors)).toEqual([
    'policy.blocks blocks.0.type',
    'policy.operators blocks.0.properties.html',
    'policy.actions blocks.0.events.onMount.0.type',
  ]);
});

test('checkPolicy rejects HTML tag syntax unless the policy allows HTML', () => {
  const blocks = [{ id: 'p', type: 'Paragraph', properties: { content: 'a <img src=x>' } }];
  expect(rules(check(blocks))).toEqual(['policy.html blocks.0.properties.content']);
  expect(check(blocks, { html: true })).toEqual([]);
  expect(check([{ id: 'p', type: 'Paragraph', properties: { content: 'a < b <3' } }])).toEqual([]);
});

test('checkPolicy checks link targets, origins and CSS urls', () => {
  const errors = check([
    {
      id: 'box',
      type: 'Box',
      style: { background: 'url(https://tracker.test/p.gif)' },
      events: {
        onClick: [
          { id: 'a', type: 'Link', params: 'admin' },
          { id: 'b', type: 'Link', params: { url: 'https://evil.test/?d=1' } },
        ],
        onBlur: [{ id: 'c', type: 'Link', params: { pageId: { _state: 'form.next' } } }],
      },
      blocks: [
        { id: 'a1', type: 'Anchor', properties: { href: 'javascript:alert(1)' } },
        { id: 'a2', type: 'Anchor', properties: { url: '/admin' } },
        { id: 'a3', type: 'Anchor', properties: { url: 'example.com' } },
      ],
    },
  ]);
  expect(rules(errors)).toEqual([
    'policy.urls blocks.0.style.background',
    'policy.links blocks.0.events.onClick.0.params',
    'policy.urls blocks.0.events.onClick.1.params.url',
    'policy.links blocks.0.events.onBlur.0.params.pageId',
    'policy.urls blocks.0.blocks.0.properties.href',
    'policy.urls blocks.0.blocks.1.properties.url',
  ]);
});

test('checkPolicy checks CallAPI endpoints and Request ids', () => {
  const errors = check([
    {
      id: 'box',
      type: 'Box',
      events: {
        onClick: [
          { id: 'a', type: 'CallAPI', params: { endpointId: 'delete_all' } },
          { id: 'b', type: 'Request', params: ['load', 'other'] },
        ],
        onBlur: [{ id: 'c', type: 'CallAPI', params: { _state: 'form.call' } }],
      },
    },
  ]);
  expect(rules(errors)).toEqual([
    'policy.endpoints blocks.0.events.onClick.0.params.endpointId',
    'policy.requests blocks.0.events.onClick.1.params',
    'policy.literal blocks.0.events.onBlur.0.params',
  ]);
});

test('checkPolicy scopes input ids and SetState keys to the policy state', () => {
  const errors = check([
    {
      id: 'status',
      type: 'TextInput',
      events: {
        onChange: [
          { id: 's', type: 'SetState', params: { 'form.ok': 1, user: 2 } },
          { id: 't', type: 'SetState', params: { _state: 'form.x' } },
        ],
      },
    },
    { id: 'layout_box', type: 'Box' },
  ]);
  expect(rules(errors)).toEqual([
    'policy.state blocks.0.id',
    'policy.state blocks.0.events.onChange.0.params.user',
    'policy.literal blocks.0.events.onChange.1.params',
  ]);
});

test('checkPolicy requires literal properties, events and action lists', () => {
  const errors = check([
    { id: 'a', type: 'Box', properties: { _state: 'form.props' } },
    { id: 'b', type: 'Box', events: { onClick: { _state: 'form.actions' } } },
  ]);
  expect(rules(errors)).toEqual([
    'policy.literal blocks.0.properties',
    'policy.literal blocks.1.events.onClick',
  ]);
});

test('checkPolicy reports duplicate ids and schema violations with their paths', () => {
  const errors = check([
    { id: 'form.a', type: 'TextInput', properties: { title: 1 } },
    { id: 'form.a', type: 'TextInput', properties: { nope: true } },
  ]);
  expect(rules(errors)).toEqual([
    'schema blocks.0.properties',
    'policy.ids blocks.1.id',
    'schema blocks.1.properties',
  ]);
});

test('checkPolicy enforces depth, block count, actions per event and size', () => {
  const deep = [
    {
      id: 'a',
      type: 'Box',
      blocks: [
        {
          id: 'b',
          type: 'Box',
          blocks: [
            { id: 'c', type: 'Box', slots: { content: { blocks: [{ id: 'd', type: 'Box' }] } } },
          ],
        },
      ],
    },
  ];
  expect(rules(check(deep))).toEqual([
    'limits.depth blocks.0.blocks.0.blocks.0.slots.content.blocks.0',
  ]);
  const many = Array.from({ length: 11 }, (_, index) => ({ id: `b${index}`, type: 'Box' }));
  expect(rules(check(many))).toEqual(['limits.blocks blocks']);
  const actions = [1, 2, 3].map((index) => ({ id: `a${index}`, type: 'SetState', params: {} }));
  expect(
    rules(check([{ id: 'x', type: 'Box', events: { onClick: { try: actions, catch: [] } } }]))
  ).toEqual(['limits.actionsPerEvent blocks.0.events.onClick']);
  expect(
    rules(check([{ id: 'x', type: 'Box' }], { limits: { ...policy.limits, bytes: 10 } }))
  ).toEqual(['limits.bytes blocks']);
});

test('checkPolicy walks skeletons and event control branches', () => {
  const errors = check(
    [
      {
        id: 'box',
        type: 'Box',
        skeleton: { id: 'sk', type: 'DangerousHtml' },
        events: {
          onClick: [
            {
              ':if': { _global: 'flag' },
              ':then': [{ id: 'a', type: 'Logout' }],
              ':else': [{ id: 'b', type: 'SetState', params: { 'form.x': 1 } }],
            },
            {
              ':switch': [{ ':case': true, ':then': [{ id: 'c', type: 'Link', params: 'admin' }] }],
              ':default': [{ id: 'b', type: 'SetState', params: { 'form.y': 1 } }],
            },
          ],
        },
      },
    ],
    wideEvents
  );
  expect(rules(errors)).toEqual([
    'policy.operators blocks.0.events.onClick.0.:if',
    'policy.actions blocks.0.events.onClick.0.:then.0.type',
    'policy.links blocks.0.events.onClick.1.:switch.0.:then.0.params',
    'policy.structure blocks.0.events.onClick.1.:default.0.id',
    'policy.blocks blocks.0.skeleton.type',
  ]);
});

test('checkPolicy accepts Request object forms and rejects all', () => {
  const errors = check(
    [
      {
        id: 'box',
        type: 'Box',
        events: {
          onClick: [
            { id: 'a', type: 'Request', params: { requestId: 'load' } },
            { id: 'b', type: 'Request', params: { requestIds: ['load'] } },
            { id: 'c', type: 'Request', params: { all: true } },
          ],
        },
      },
    ],
    wideEvents
  );
  expect(rules(errors)).toEqual(['policy.requests blocks.0.events.onClick.2.params']);
});

test('checkPolicy classifies URLs that resolve off the app', () => {
  const errors = check([
    { id: 'a', type: 'Img', properties: { src: '//tracker.test/p.gif' } },
    { id: 'b', type: 'Img', properties: { src: '/\\tracker.test/p.gif' } },
    { id: 'c', type: 'Img', properties: { src: '/logo.png' } },
    { id: 'd', type: 'Paragraph', properties: { content: '![x](https://tracker.test/p.png)' } },
    { id: 'e', type: 'Box', style: { background: 'u\\72l(https://tracker.test/p.gif)' } },
    { id: 'f', type: 'Box', style: { background: 'image-set("https://tracker.test/a.png" 1x)' } },
    { id: 'g', type: 'Paragraph', properties: { content: 'data:text/html,hello' } },
    { id: 'h', type: 'Box', properties: { image: 'https://example.com/a.png' } },
  ]);
  expect(rules(errors)).toEqual([
    'policy.urls blocks.0.properties.src',
    'policy.urls blocks.1.properties.src',
    'policy.urls blocks.3.properties.content',
    'policy.urls blocks.4.style.background',
    'policy.urls blocks.5.style.background',
    'policy.urls blocks.6.properties.content',
  ]);
});

test('checkPolicy leaves plain text with colons alone', () => {
  expect(
    check([
      { id: 'a', type: 'Paragraph', properties: { content: 'Name:' } },
      { id: 'b', type: 'Paragraph', properties: { content: 'Time: 10:30 (local)' } },
    ])
  ).toEqual([]);
});

test('checkPolicy allows duplicate ids on blocks that do not bind state', () => {
  expect(
    check([
      { id: 'divider', type: 'Box' },
      { id: 'divider', type: 'Box' },
    ])
  ).toEqual([]);
});

test('checkPolicy reports structure errors with their paths', () => {
  const errors = check([
    { type: 'Box' },
    'not a block',
    { id: 'x', type: 'Box', areas: {}, slots: {} },
    { id: 'y', type: 'Box', blocks: { _state: 'blocks' } },
  ]);
  expect(rules(errors)).toEqual([
    'policy.structure blocks.0.id',
    'policy.structure blocks.1',
    'policy.structure blocks.2',
    'policy.structure blocks.3.blocks',
  ]);
});

// The client runs an object as an operator once its other keys evaluate to
// undefined, so { _user: 'email', x: { _if: { test: false } } } runs _user.
const vanishes = { _if: { test: false } };

test.each([
  [
    'an unlisted operator beside a key that evaluates to undefined',
    { id: 'p', type: 'Paragraph', properties: { content: { _user: 'email', x: vanishes } } },
    ['policy.operators blocks.0.properties.content'],
  ],
  [
    'an unlisted operator beside an undefined value',
    { id: 'b', type: 'Box', style: { color: { _user: 'email', x: undefined } } },
    ['policy.operators blocks.0.style.color'],
  ],
  [
    'a URL an operator computes once its sibling vanishes',
    { id: 'a', type: 'Anchor', properties: { href: { _state: 'form.url', x: vanishes } } },
    ['policy.urls blocks.0.properties.href'],
  ],
  [
    'CallAPI payload read by an unlisted operator once its sibling vanishes',
    {
      id: 'b',
      type: 'Box',
      events: {
        onClick: [
          {
            id: 'a',
            type: 'CallAPI',
            params: { endpointId: 'submit', payload: { leak: { _user: true, x: vanishes } } },
          },
        ],
      },
    },
    ['policy.operators blocks.0.events.onClick.0.params.payload.leak'],
  ],
  [
    'Link params an operator computes once its sibling vanishes',
    {
      id: 'b',
      type: 'Box',
      events: {
        onClick: [{ id: 'a', type: 'Link', params: { _state: 'form.link', x: vanishes } }],
      },
    },
    ['policy.literal blocks.0.events.onClick.0.params'],
  ],
  [
    'SetState params an operator computes once its sibling vanishes',
    {
      id: 'b',
      type: 'Box',
      events: {
        onClick: [
          { id: 'a', type: 'SetState', params: { _state: 'form.values', 'form.x': vanishes } },
        ],
      },
    },
    ['policy.literal blocks.0.events.onClick.0.params'],
  ],
  [
    'an operator that surfaces once a nested object vanishes',
    {
      id: 'p',
      type: 'Paragraph',
      properties: { content: { _user: 'email', y: { a: vanishes, _state: 'form.z' } } },
    },
    ['policy.operators blocks.0.properties.content'],
  ],
  [
    'properties an operator computes once its sibling vanishes',
    { id: 'b', type: 'Box', properties: { _state: 'form.props', x: vanishes } },
    ['policy.literal blocks.0.properties'],
  ],
])('checkPolicy rejects %s', (_, block, expected) => {
  expect(rules(check([block]))).toEqual(expected);
});

test.each([
  ['a search score beside a title', { _score: 0.5, title: 'x' }],
  ['a document version key beside a name', { __v: 0, name: 'x' }],
  ['an operator name beside an object that cannot vanish', { _user: 'x', y: { _if: 1, b: 2 } }],
])('checkPolicy allows %s as data', (_, record) => {
  expect(check([{ id: 'b', type: 'Box', properties: { record }, style: { record } }])).toEqual([]);
});

// Content arrives as the server holds it: a { "~e": ... } value revived as an Error,
// which the page writes back as "~e" for the client to revive.
test.each([
  [
    'an error',
    { '~e': { name: 'Error', message: { _global: 'x' } } },
    ['policy.structure blocks.0.properties.record.~e'],
  ],
  [
    'an error in a list',
    [{ '~e': { name: 'Error', message: 'x' } }],
    ['policy.structure blocks.0.properties.record.0.~e'],
  ],
  [
    'a date wrapper that is not a date',
    { '~d': { _global: 'x' } },
    ['policy.structure blocks.0.properties.record.~d'],
  ],
  [
    'an array wrapper, revived as an array',
    { '~arr': [{ _global: 'x' }] },
    ['policy.operators blocks.0.properties.record.0'],
  ],
  [
    'any other reserved key',
    { '~foo': { _global: 'x' } },
    ['policy.structure blocks.0.properties.record.~foo'],
  ],
])('checkPolicy checks content holding %s as the client receives it', (_, record, expected) => {
  const properties = serializer.deserialize({ record });
  expect(rules(check([{ id: 'b', type: 'Box', properties }]))).toEqual(expected);
});

test('checkPolicy allows a date', () => {
  expect(check([{ id: 'b', type: 'Box', properties: { record: new Date(0) } }])).toEqual([]);
});

test.each([
  ['a key under the state', { _state: 'form.name' }, []],
  ['a key object under the state', { _state: { key: 'form.name', default: '' } }, []],
  ['a key outside the state', { _state: 'session_token' }, ['policy.state']],
  ['the whole state', { _state: true }, ['policy.state']],
  ['every key through all', { _state: { key: 'form.name', all: true } }, ['policy.state']],
  [
    'a computed key',
    { _state: { key: { _if: { test: true, then: 'x', else: 'y' } } } },
    ['policy.state'],
  ],
  ['an escaped read outside the state', { __state: 'session_token' }, ['policy.state']],
])('checkPolicy scopes a _state read in a CallAPI payload: %s', (_, read, expected) => {
  const errors = check([
    {
      id: 'box',
      type: 'Box',
      events: {
        onClick: [
          { id: 'send', type: 'CallAPI', params: { endpointId: 'submit', payload: { read } } },
        ],
      },
    },
  ]);
  expect(errors.map(({ rule }) => rule)).toEqual(expected);
});

test('checkPolicy allows any _state read when the policy sets no state', () => {
  const errors = check(
    [{ id: 'p', type: 'Paragraph', properties: { content: { _state: 'anything' } } }],
    { state: undefined }
  );
  expect(errors).toEqual([]);
});

// A block schema marks its URL-valued properties with urlKind, whatever they are called.
const markedSchemas = {
  Search: {
    properties: {
      properties: {
        type: 'object',
        properties: {
          indexUrl: { type: ['string', 'array'], urlKind: 'src', items: { type: 'string' } },
          result: { type: 'object', properties: { url: { type: 'string', urlKind: false } } },
        },
      },
    },
  },
  Tile: {
    properties: {
      properties: {
        type: 'object',
        properties: {
          links: {
            type: 'array',
            items: { type: 'object', properties: { target: { type: 'string', urlKind: 'href' } } },
          },
          logo: { oneOf: [{ type: 'string', urlKind: 'src' }, { type: 'object' }] },
        },
      },
    },
  },
};

function checkMarked(blocks) {
  return checkPolicy({
    routes,
    blocks,
    policy: { ...policy, blocks: ['Search', 'Tile'] },
    blockMetas,
    blockSchemas: markedSchemas,
  });
}

test('checkPolicy checks URLs where the block schema marks them, whatever the key', () => {
  const errors = checkMarked([
    { id: 'a', type: 'Search', properties: { indexUrl: 'https://tracker.test/index.json' } },
    { id: 'b', type: 'Search', properties: { indexUrl: ['/index.json', 'tracker.test/i.json'] } },
    { id: 'c', type: 'Tile', properties: { links: [{ target: '/thanks' }, { target: '/admin' }] } },
    { id: 'd', type: 'Tile', properties: { logo: 'https://example.com/logo.png' } },
    { id: 'e', type: 'Tile', properties: { logo: '//tracker.test/p.gif' } },
    { id: 'f', type: 'Search', properties: { indexUrl: { _state: 'form.index' } } },
  ]);
  expect(rules(errors)).toEqual([
    'policy.urls blocks.0.properties.indexUrl',
    'policy.urls blocks.2.properties.links.1.target',
    'policy.urls blocks.4.properties.logo',
    'policy.urls blocks.5.properties.indexUrl',
  ]);
});

test('checkPolicy leaves a property the schema opts out with urlKind false to the text rules', () => {
  expect(
    checkMarked([{ id: 'a', type: 'Search', properties: { result: { url: 'link' } } }])
  ).toEqual([]);
});

// A block that marks nothing (any block without urlKind marks) is judged by key name.
const unmarkedSchemas = {
  Card: {
    properties: {
      properties: {
        type: 'object',
        properties: {
          href: { type: 'string' },
          image: { type: 'string' },
          note: { type: 'string' },
        },
      },
    },
  },
};

test.each([
  ['a leading space', { href: ' https://tracker.test/' }],
  ['a script scheme', { href: 'javascript: alert(1)' }],
  ['a leading tab', { href: '\tjavascript:alert(1)' }],
  ['a newline inside the scheme', { href: 'java\nscript:alert(1)' }],
  ['an off-site image', { image: '//tracker.test/p.gif' }],
])(
  'checkPolicy judges a described but unmarked URL property with %s by its key',
  (_, properties) => {
    const errors = checkPolicy({
      routes,
      blocks: [{ id: 'a', type: 'Card', properties }],
      policy: { ...policy, blocks: ['Card'] },
      blockMetas,
      blockSchemas: unmarkedSchemas,
    });
    expect(rules(errors)).toEqual([
      `policy.urls blocks.0.properties.${Object.keys(properties)[0]}`,
    ]);
  }
);

test.each([
  ['a leading space', ' https://tracker.test/p.gif'],
  ['a leading tab', '\t//tracker.test/p.gif'],
  ['a script scheme with a space', 'javascript: alert(1)'],
  ['a newline inside a script scheme', 'java\nscript:alert(1)'],
])('checkPolicy finds a URL in text with %s', (_, note) => {
  const errors = checkPolicy({
    routes,
    blocks: [{ id: 'a', type: 'Card', properties: { note } }],
    policy: { ...policy, blocks: ['Card'] },
    blockMetas,
    blockSchemas: unmarkedSchemas,
  });
  expect(rules(errors)).toEqual(['policy.urls blocks.0.properties.note']);
});

test('checkPolicy allows an app path with surrounding whitespace where a page is listed', () => {
  const errors = checkPolicy({
    routes,
    blocks: [{ id: 'a', type: 'Card', properties: { href: ' /thanks\n' } }],
    policy: { ...policy, blocks: ['Card'] },
    blockMetas,
    blockSchemas: unmarkedSchemas,
  });
  expect(errors).toEqual([]);
});

test('checkPolicy treats a key that names no client operator as data', () => {
  const clientOperators = new Set(['_state', '_if', '_user']);
  const errors = checkPolicy({
    routes,
    blocks: [
      {
        id: 'b',
        type: 'Box',
        properties: { hit: { _score: 0.5 }, source: { _source: { title: 'x' } } },
        style: { record: { _user: 'email' } },
      },
    ],
    policy,
    blockMetas,
    blockSchemas,
    clientOperators,
  });
  expect(rules(errors)).toEqual(['policy.operators blocks.0.style.record']);
});

test('checkPolicy refuses content nested deeper than the Dynamic data limit before walking it', () => {
  let deep = { value: 'x' };
  for (let level = 0; level < 100000; level += 1) {
    deep = { child: deep };
  }
  expect(rules(check([{ id: 'b', type: 'Box', properties: { deep } }]))).toEqual([
    'limits.depth blocks',
  ]);
});
