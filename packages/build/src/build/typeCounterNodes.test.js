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

import buildApi from './buildApi/buildApi.js';
import buildConnections from './buildConnections.js';
import buildPages from './full/buildPages.js';
import createCounter from '../utils/createCounter.js';
import testContext from '../test-utils/testContext.js';

function ifNode(name) {
  return { _if: { test: { _state: name }, then: 1, else: 2 }, '~k': `if-${name}` };
}

function buildApp() {
  const context = testContext({ logger: { warn: () => {}, log: () => {} } });
  const components = {
    connections: [{ id: 'db', type: 'MongoDBCollection', properties: { collection: 'items' } }],
    api: [
      {
        id: 'save',
        type: 'Api',
        routine: [
          {
            ':switch': [
              {
                ':case': true,
                ':then': [
                  {
                    id: 'insert',
                    type: 'MongoDBInsertOne',
                    connectionId: 'db',
                    properties: { doc: ifNode('step') },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    pages: [
      {
        id: 'page',
        type: 'Box',
        auth: { public: true },
        blocks: [
          {
            id: 'title',
            type: 'Title',
            properties: { content: ifNode('block') },
          },
          {
            id: 'save',
            type: 'Button',
            requests: [
              {
                id: 'fetch',
                type: 'MongoDBFind',
                connectionId: 'db',
                payload: { value: ifNode('payload') },
                properties: { query: ifNode('properties') },
              },
            ],
            events: {
              onClick: [
                {
                  ':if': true,
                  ':then': [{ id: 'set', type: 'SetState', params: { value: ifNode('action') } }],
                },
              ],
            },
          },
        ],
      },
    ],
  };
  buildConnections({ components, context });
  buildApi({ components, context });
  buildPages({ components, context });
  return { components, context };
}

function stateNames(nodes) {
  return nodes.map((node) => node._if.test._state).sort();
}

test('createCounter records each node once, and only when given', () => {
  const counter = createCounter();
  const node = { type: 'Box' };
  counter.increment('Box', 'k1', node);
  counter.increment('Box', 'k1', node);
  counter.increment('Box', 'k2');
  counter.increment('Card', 'k3');
  expect(counter.getCount('Box')).toBe(3);
  expect(counter.getNodes('Box')).toEqual([node]);
  expect(counter.getNodes('Box')[0]).toBe(node);
  expect(counter.getNodes('Card')).toEqual([]);
  expect(counter.getNodes('Missing')).toEqual([]);
  expect([...counter.getNodeEntries()]).toEqual([['Box', new Map([[node, 'k1']])]]);
  counter.clearNodes();
  expect(counter.getNodes('Box')).toEqual([]);
  expect(counter.getCount('Box')).toBe(3);
});

test('operator nodes are recorded on the counter for the side they run on', () => {
  const { context } = buildApp();
  expect(stateNames(context.typeCounters.operators.client.getNodes('_if'))).toEqual([
    'action',
    'block',
    'payload',
  ]);
  expect(stateNames(context.typeCounters.operators.server.getNodes('_if'))).toEqual([
    'properties',
    'step',
  ]);
  [
    ...context.typeCounters.operators.client.getNodes('_if'),
    ...context.typeCounters.operators.server.getNodes('_if'),
  ].forEach((node) => {
    expect(node['~k']).toBe(`if-${node._if.test._state}`);
  });
});

test('names an _operator call takes record no node', () => {
  const context = testContext({ logger: { warn: () => {}, log: () => {} } });
  const components = {
    pages: [
      {
        id: 'page',
        type: 'Box',
        auth: { public: true },
        properties: { title: { _operator: { name: '_sum', params: [1, 2] } } },
      },
    ],
  };
  buildPages({ components, context });
  const counter = context.typeCounters.operators.client;
  expect(counter.getCount('_sum')).toBe(1);
  expect(counter.getNodes('_sum')).toEqual([]);
  expect(counter.getNodes('_operator')).toHaveLength(1);
});

test('blocks, actions, requests, steps and connections are recorded once in their built shape', () => {
  const { components, context } = buildApp();
  const { typeCounters } = context;

  const [page] = components.pages;
  expect(typeCounters.blocks.getNodes('Box')).toEqual([page]);
  expect(typeCounters.blocks.getNodes('Box')[0]).toBe(page);
  expect(typeCounters.blocks.getNodes('Title')).toHaveLength(1);
  expect(typeCounters.blocks.getNodes('Button')).toHaveLength(1);
  const [title] = typeCounters.blocks.getNodes('Title');
  const [button] = typeCounters.blocks.getNodes('Button');
  expect(page.slots.content.blocks[0]).toBe(title);
  expect(page.slots.content.blocks[1]).toBe(button);
  expect(page.blocks).toBeUndefined();
  expect(title.blockId).toBe('title');

  const [setState] = typeCounters.actions.getNodes('SetState');
  expect(typeCounters.actions.getNodes('SetState')).toHaveLength(1);
  expect(setState.id).toBe('set');
  expect(button.events.onClick.try[0][':then'][0]).toBe(setState);

  expect(typeCounters.requests.getNodes('MongoDBFind')).toHaveLength(1);
  const [request] = typeCounters.requests.getNodes('MongoDBFind');
  expect(request.requestId).toBe('fetch');
  expect(request.id).toBe('request:page:fetch');
  expect(page.requests[0]).toBe(request);

  expect(typeCounters.requests.getNodes('MongoDBInsertOne')).toHaveLength(1);
  const [step] = typeCounters.requests.getNodes('MongoDBInsertOne');
  expect(step.stepId).toBe('insert');
  expect(components.api[0].routine[0][':switch'][0][':then'][0]).toBe(step);

  expect(typeCounters.connections.getNodes('MongoDBCollection')).toHaveLength(1);
  expect(typeCounters.connections.getNodes('MongoDBCollection')[0]).toBe(components.connections[0]);
  expect(components.connections[0].connectionId).toBe('db');
});

test('page type counters count types and keep no nodes, which only the app counters keep', () => {
  const { context } = buildApp();
  const pageCounters = context.pageTypeCounters.get('page');
  expect(pageCounters.blocks.getCount('Title')).toBe(1);
  expect(pageCounters.blocks.getNodes('Title')).toEqual([]);
  expect(pageCounters.actions.getCount('SetState')).toBe(1);
  expect(pageCounters.actions.getNodes('SetState')).toEqual([]);
  expect(pageCounters.operators.getNodes('_if')).toEqual([]);
  expect(context.typeCounters.blocks.getNodes('Title')).toHaveLength(1);
});
