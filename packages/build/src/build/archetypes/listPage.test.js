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

import listPage from './listPage.js';

const collections = {
  controls: {
    tenant: 'shared',
    fields: {
      _id: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      framework_id: { type: 'string' },
      status: { type: 'string', enum: ['draft', 'active', 'retired', 'na'] },
    },
    relations: { framework_id: { collection: 'frameworks', field: '_id' } },
    connections: [{ connectionId: 'controls', read: true, write: false }],
  },
};

const typedCollections = {
  events: {
    fields: {
      _id: { type: 'string' },
      name: { type: 'string' },
      occurred_at: { instanceof: 'Date' },
      count: { type: 'number' },
      archived: { type: 'boolean' },
      card: { type: 'string' },
    },
    connections: [{ connectionId: 'events', read: true }],
  },
};

function run(properties, slots) {
  return listPage({ properties, slots, pageId: 'controls', collections, configKey: 'k1' });
}

test('listPage emits a layout, one list request and the block tree', () => {
  const result = run({
    collection: 'controls',
    columns: ['title', 'framework_id', 'status'],
    filters: ['framework_id', 'status'],
    search: ['title', 'description'],
    rowLink: { pageId: 'control', urlQuery: { id: '$_id' } },
  });
  expect(result.layoutType).toBe('Box');
  expect(result.events.onInitAsync).toEqual([
    { id: 'reload_list', type: 'Request', params: 'list' },
    { id: 'set_rows', type: 'SetState', params: { rows: { _request: 'list' } } },
  ]);
  expect(result.requests).toHaveLength(1);
  const request = result.requests[0];
  expect(request.id).toBe('list');
  expect(request.type).toBe('MongoDBFind');
  expect(request.connectionId).toBe('controls');
  expect(request.properties.options.limit).toBe(50);
  // Projection includes _id, every column and the search fields.
  expect(request.properties.options.projection).toMatchObject({
    _id: 1,
    title: 1,
    framework_id: 1,
    status: 1,
    description: 1,
  });
});

test('listPage derives the read connection when the collection has exactly one', () => {
  const result = run({ collection: 'controls', columns: ['title'] });
  expect(result.requests[0].connectionId).toBe('controls');
});

test('listPage requires connectionId when the read connection is ambiguous', () => {
  const twoReads = {
    controls: {
      ...collections.controls,
      connections: [
        { connectionId: 'a', read: true },
        { connectionId: 'b', read: true },
      ],
    },
  };
  expect(() =>
    listPage({
      properties: { collection: 'controls', columns: ['title'] },
      pageId: 'controls',
      collections: twoReads,
      configKey: 'k1',
    })
  ).toThrow(/cannot derive a read connection/);
});

test('listPage builds an equality drop per filter and a regex $or for search', () => {
  const result = run({
    collection: 'controls',
    columns: ['title'],
    filters: ['status'],
    search: ['title', 'description'],
  });
  const assign = result.requests[0].properties.query['_object.assign'];
  // { }, status drop, search drop
  expect(assign).toHaveLength(3);
  expect(assign[1]._if.then).toEqual({ status: { _payload: 'status' } });
  expect(assign[2]._if.then.$or).toEqual([
    { title: { $regex: { _payload: 'search' }, $options: 'i' } },
    { description: { $regex: { _payload: 'search' }, $options: 'i' } },
  ]);
  expect(result.requests[0].payload).toEqual({
    status: { _state: 'filters.status' },
    search: { _state: 'filters.search' },
  });
});

test('listPage renders an enum filter as a Selector and a text filter as a TextInput', () => {
  const result = run({
    collection: 'controls',
    columns: ['title'],
    filters: ['status', 'framework_id'],
  });
  const filterBox = result.blocks.find((b) => b.id === 'filters');
  const status = filterBox.blocks.find((b) => b.id === 'filters.status');
  const framework = filterBox.blocks.find((b) => b.id === 'filters.framework_id');
  expect(status.type).toBe('Selector');
  expect(status.properties.options).toEqual(['draft', 'active', 'retired', 'na']);
  expect(status.events.onChange).toBeDefined();
  expect(framework.type).toBe('TextInput');
  expect(framework.events.onPressEnter).toBeDefined();
});

test('listPage renders a string column as a labelled Paragraph and an enum column as a Tag', () => {
  const result = run({
    collection: 'controls',
    columns: ['title', 'description', 'status'],
  });
  const rows = result.blocks.find((b) => b.id === 'rows');
  const card = rows.blocks[0];
  // First column is the card title.
  expect(card.properties.title).toEqual({ _request: 'list.$.title' });
  const cells = card.blocks;
  const description = cells.find((c) => c.id === 'rows.$.cell_description');
  const status = cells.find((c) => c.id === 'rows.$.cell_status');
  expect(description.type).toBe('Label');
  expect(description.properties.title).toBe('Description');
  expect(description.blocks[0].type).toBe('Paragraph');
  expect(description.blocks[0].properties.content).toEqual({ _request: 'list.$.description' });
  expect(status.type).toBe('Label');
  expect(status.properties.title).toBe('Status');
  expect(status.blocks[0].type).toBe('Tag');
  expect(status.blocks[0].properties.title).toEqual({ _request: 'list.$.status' });
});

test('listPage formats a date column with _intl.dateTimeFormat and guards a missing value', () => {
  const result = listPage({
    properties: { collection: 'events', columns: ['name', 'occurred_at'] },
    pageId: 'events',
    collections: typedCollections,
    configKey: 'k1',
  });
  const card = result.blocks.find((b) => b.id === 'rows').blocks[0];
  const cell = card.blocks.find((c) => c.id === 'rows.$.cell_occurred_at');
  expect(cell.properties.title).toBe('Occurred At');
  expect(cell.blocks[0].properties.content._if.else).toEqual({
    '_intl.dateTimeFormat': {
      on: { _request: 'list.$.occurred_at' },
      options: { dateStyle: 'medium' },
    },
  });
  expect(cell.blocks[0].properties.content._if.then).toBe(null);
});

test('listPage formats a number column with _intl.numberFormat', () => {
  const result = listPage({
    properties: { collection: 'events', columns: ['name', 'count'] },
    pageId: 'events',
    collections: typedCollections,
    configKey: 'k1',
  });
  const card = result.blocks.find((b) => b.id === 'rows').blocks[0];
  const cell = card.blocks.find((c) => c.id === 'rows.$.cell_count');
  expect(cell.blocks[0].properties.content._if.else).toEqual({
    '_intl.numberFormat': { on: { _request: 'list.$.count' } },
  });
});

test('listPage renders a boolean column as Yes/No rather than a blank cell', () => {
  const result = listPage({
    properties: { collection: 'events', columns: ['name', 'archived'] },
    pageId: 'events',
    collections: typedCollections,
    configKey: 'k1',
  });
  const card = result.blocks.find((b) => b.id === 'rows').blocks[0];
  const cell = card.blocks.find((c) => c.id === 'rows.$.cell_archived');
  expect(cell.blocks[0].properties.content._if.else).toEqual({
    _if: { test: { _request: 'list.$.archived' }, then: 'Yes', else: 'No' },
  });
});

test('listPage namespaces generated cell ids so a field named card cannot collide', () => {
  const result = listPage({
    properties: { collection: 'events', columns: ['name', 'card'] },
    pageId: 'events',
    collections: typedCollections,
    configKey: 'k1',
  });
  const card = result.blocks.find((b) => b.id === 'rows').blocks[0];
  expect(card.id).toBe('rows.$.card');
  expect(card.blocks.map((block) => block.id)).toEqual(['rows.$.cell_card']);
});

test('listPage turns a $field rowLink token into a _request row read', () => {
  const result = run({
    collection: 'controls',
    columns: ['title'],
    rowLink: { pageId: 'control', urlQuery: { id: '$_id' }, input: { slug: '$title' } },
  });
  const card = result.blocks.find((b) => b.id === 'rows').blocks[0];
  expect(card.events.onClick[0]).toEqual({
    id: 'open_row',
    type: 'Link',
    params: {
      pageId: 'control',
      urlQuery: { id: { _request: 'list.$._id' } },
      input: { slug: { _request: 'list.$.title' } },
    },
  });
});

test('listPage defaults sort to the first declared date field, descending', () => {
  const result = listPage({
    properties: { collection: 'events', columns: ['name'] },
    pageId: 'events',
    collections: typedCollections,
    configKey: 'k1',
  });
  expect(result.requests[0].properties.options.sort).toEqual({ occurred_at: -1 });
});

test('listPage defaults sort to _id descending when the collection declares no date field', () => {
  const result = run({ collection: 'controls', columns: ['title'] });
  expect(result.requests[0].properties.options.sort).toEqual({ _id: -1 });
});

test('listPage defaults columns to every declared field', () => {
  const result = run({ collection: 'controls' });
  expect(result.requests[0].properties.options.projection).toMatchObject({
    _id: 1,
    title: 1,
    description: 1,
    framework_id: 1,
    status: 1,
  });
});

test('listPage gates the empty state on the list request succeeding and being empty', () => {
  const result = run({ collection: 'controls', columns: ['title'] });
  const empty = result.blocks.find((b) => b.id === 'empty');
  expect(empty.type).toBe('Result');
  expect(empty.visible._and).toEqual([
    { _get: { key: 'success', from: { _request: { key: 'list', status: true } } } },
    { _get: { key: 'empty', from: { _request: { key: 'list', status: true } } } },
  ]);
  const rows = result.blocks.find((b) => b.id === 'rows');
  expect(rows.skeleton.blocks[0].type).toBe('Skeleton');
});

test('listPage emits an error Result carrying the message and a retry button', () => {
  const result = run({ collection: 'controls', columns: ['title'] });
  const error = result.blocks.find((b) => b.id === 'load_error');
  expect(error.type).toBe('Result');
  expect(error.properties.status).toBe('error');
  expect(error.properties.subTitle).toEqual({
    _get: { key: 'error', from: { _request: { key: 'list', status: true } } },
  });
  expect(error.visible).toEqual({
    _not: {
      _type: {
        type: 'none',
        on: { _get: { key: 'error', from: { _request: { key: 'list', status: true } } } },
      },
    },
  });
  const retry = error.slots.extra.blocks[0];
  expect(retry.id).toBe('retry_list');
  expect(retry.events.onClick).toContainEqual({
    id: 'reload_list',
    type: 'Request',
    params: 'list',
  });
});

test('listPage places the header, rowActions and footer slots', () => {
  const headerBlock = { id: 'export', type: 'Button', properties: { title: 'Export' } };
  const rowActionBlock = { id: 'rows.$.edit', type: 'Button', properties: { title: 'Edit' } };
  const footerBlock = { id: 'note', type: 'Paragraph', properties: { content: 'note' } };
  const result = run(
    { collection: 'controls', columns: ['title', 'status'] },
    {
      header: { blocks: [headerBlock] },
      rowActions: { blocks: [rowActionBlock] },
      footer: { blocks: [footerBlock] },
    }
  );
  expect(result.blocks.find((b) => b.id === 'header').blocks).toContain(headerBlock);
  const card = result.blocks.find((b) => b.id === 'rows').blocks[0];
  const rowActions = card.blocks.find((b) => b.id === 'rows.$.row_actions');
  expect(rowActions.blocks).toEqual([rowActionBlock]);
  expect(result.blocks[result.blocks.length - 1]).toBe(footerBlock);
});

test('listPage rejects a slot that is not an object with a blocks list', () => {
  expect(() => run({ collection: 'controls', columns: ['title'] }, { footer: [] })).toThrow(
    /slot "footer" must be an object with a "blocks" list/
  );
});

test('listPage rejects an unknown slot name', () => {
  expect(() =>
    run({ collection: 'controls', columns: ['title'] }, { headr: { blocks: [] } })
  ).toThrow(/has no slot "headr". ListPage slots: header, rowActions, footer/);
});

test('listPage throws when the collection is not declared', () => {
  expect(() =>
    listPage({
      properties: { collection: 'missing' },
      pageId: 'p',
      collections,
      configKey: 'k1',
    })
  ).toThrow(/not declared in collections/);
});

test('listPage throws when a column is not a declared field', () => {
  expect(() =>
    listPage({
      properties: { collection: 'controls', columns: ['titel'] },
      pageId: 'controls',
      collections,
      configKey: 'k1',
    })
  ).toThrow(/is not a field of collection "controls".*Did you mean "title"/s);
});

test('listPage honours an explicit layout, title and pageSize', () => {
  const result = run({
    collection: 'controls',
    columns: ['title'],
    title: 'All Controls',
    pageSize: 25,
    layout: { type: 'PageSidebarLayout', properties: { theme: 'dark' } },
  });
  expect(result.layoutType).toBe('PageSidebarLayout');
  expect(result.layoutProperties).toEqual({ theme: 'dark' });
  expect(result.requests[0].properties.options.limit).toBe(25);
  const title = result.blocks.find((b) => b.id === 'header').blocks[0];
  expect(title.properties.content).toBe('All Controls');
});

test('listPage passes header actions through', () => {
  const action = { id: 'new', type: 'Button', properties: { title: 'New' } };
  const result = run({ collection: 'controls', columns: ['title'], actions: [action] });
  const header = result.blocks.find((b) => b.id === 'header');
  expect(header.blocks).toContain(action);
});
