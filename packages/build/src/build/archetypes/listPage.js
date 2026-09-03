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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import resolveCollectionField, { resolveCollection } from './resolveCollectionField.js';
import humanizeFieldName from './humanizeFieldName.js';

const LIST_REQUEST_ID = 'list';
const ROWS_BLOCK_ID = 'rows';

// A column/filter/field entry is either a bare field name (string) or an object
// carrying a `field` key plus overrides. Normalise to { field, overrides }.
function normalizeEntry({ entry, key, archetype, pageId, configKey }) {
  if (type.isString(entry)) {
    return { field: entry, overrides: {} };
  }
  if (type.isObject(entry) && type.isString(entry.field)) {
    return { field: entry.field, overrides: entry };
  }
  throw new ConfigError(
    `${archetype} on page "${pageId}" ${key} entries must be a field name or an object with a "field" key. Received ${JSON.stringify(
      entry
    )}.`,
    { configKey, checkSlug: 'archetype' }
  );
}

// Picks the read connection for the list request. Defaults to the collection's
// single read connection; when zero or more than one qualifies, connectionId is
// required (Decision 2 / §3.1).
function resolveConnectionId({ properties, collection, collectionName, pageId, configKey }) {
  if (type.isString(properties.connectionId)) {
    return properties.connectionId;
  }
  const readConnections = (collection.connections ?? []).filter((c) => c.read !== false);
  if (readConnections.length === 1) {
    return readConnections[0].connectionId;
  }
  throw new ConfigError(
    `ListPage on page "${pageId}" cannot derive a read connection for collection "${collectionName}" (${
      readConnections.length
    } candidates). Set the "connectionId" property.`,
    { configKey, checkSlug: 'archetype' }
  );
}

// { id: $_id, tab: overview } -> { id: { _request: 'list.$._id' }, tab: overview }
// A string value starting with $ names a row field read from the list response.
function resolveRowTokens(map) {
  const out = {};
  Object.keys(map ?? {}).forEach((key) => {
    const value = map[key];
    if (type.isString(value) && value.startsWith('$')) {
      out[key] = { _request: `${LIST_REQUEST_ID}.$.${value.slice(1)}` };
    } else {
      out[key] = value;
    }
  });
  return out;
}

// The action pair every load and every filter change runs: fetch, then copy the
// response into the List block's state so it knows its row count (the response
// fields are still read with _request:list.$.field inside the rows).
function reloadActions() {
  return [
    { id: 'reload_list', type: 'Request', params: LIST_REQUEST_ID },
    {
      id: 'set_rows',
      type: 'SetState',
      params: { [ROWS_BLOCK_ID]: { _request: LIST_REQUEST_ID } },
    },
  ];
}

function buildFilterBlock({ resolved, overrides }) {
  const id = `filters.${resolved.field}`;
  const title = overrides.label ?? resolved.label;
  const base = { id, layout: { span: 6 }, properties: { title, allowClear: true } };
  if (!type.isNone(overrides.class)) base.class = overrides.class;
  if (!type.isNone(overrides.style)) base.style = overrides.style;

  if (resolved.isEnum) {
    return {
      ...base,
      type: 'Selector',
      properties: { ...base.properties, options: resolved.enumValues },
      events: { onChange: reloadActions() },
    };
  }
  if (resolved.dataType === 'boolean') {
    return {
      ...base,
      type: 'Selector',
      properties: { ...base.properties, options: [true, false] },
      events: { onChange: reloadActions() },
    };
  }
  // string, number, date and undeclared-type fields filter through a text box
  // matched on Enter. (Date-range filters are a follow-on; v1 is equality.)
  return { ...base, type: 'TextInput', events: { onPressEnter: reloadActions() } };
}

function buildFilterQueryDrop(field) {
  return {
    _if: {
      test: { _not: { _type: { type: 'empty', on: { _payload: field } } } },
      then: { [field]: { _payload: field } },
      else: {},
    },
  };
}

function buildSearchQueryDrop(searchFields) {
  return {
    _if: {
      test: { _not: { _type: { type: 'empty', on: { _payload: 'search' } } } },
      then: {
        $or: searchFields.map((field) => ({
          [field]: { $regex: { _payload: 'search' }, $options: 'i' },
        })),
      },
      else: {},
    },
  };
}

function buildRowCell({ resolved }) {
  const id = `${ROWS_BLOCK_ID}.$.${resolved.field}`;
  const value = { _request: `${LIST_REQUEST_ID}.$.${resolved.field}` };
  if (resolved.isEnum) {
    return { id, type: 'Tag', properties: { title: value } };
  }
  return { id, type: 'Html', properties: { html: value } };
}

// Generates a ListPage's layout, blocks and requests from its properties and
// the declared collection. Pure: no build context mutation, so it is unit
// testable in isolation.
function listPage({ properties, pageId, collections, configKey }) {
  if (!type.isString(properties.collection)) {
    throw new ConfigError(`ListPage on page "${pageId}" requires a "collection" property.`, {
      configKey,
      checkSlug: 'archetype',
    });
  }
  const collectionName = properties.collection;
  const collection = resolveCollection({
    collections,
    collectionName,
    archetype: 'ListPage',
    pageId,
    configKey,
  });

  const resolveField = (fieldName) =>
    resolveCollectionField({
      collection,
      collectionName,
      fieldName,
      archetype: 'ListPage',
      pageId,
      configKey,
    });

  // Columns default to every declared field.
  const columnEntries = type.isArray(properties.columns)
    ? properties.columns.map((entry) =>
        normalizeEntry({ entry, key: 'columns', archetype: 'ListPage', pageId, configKey })
      )
    : Object.keys(collection.fields ?? {}).map((field) => ({ field, overrides: {} }));
  if (columnEntries.length === 0) {
    throw new ConfigError(
      `ListPage on page "${pageId}" has no columns. Declare fields on collection "${collectionName}" or set the "columns" property.`,
      { configKey, checkSlug: 'archetype' }
    );
  }
  const columns = columnEntries.map(({ field, overrides }) => ({
    resolved: resolveField(field),
    overrides,
  }));

  const filterEntries = type.isArray(properties.filters)
    ? properties.filters.map((entry) =>
        normalizeEntry({ entry, key: 'filters', archetype: 'ListPage', pageId, configKey })
      )
    : [];
  const filters = filterEntries.map(({ field, overrides }) => ({
    resolved: resolveField(field),
    overrides,
  }));

  const searchFields = type.isArray(properties.search) ? properties.search : [];
  searchFields.forEach((field) => resolveField(field));

  const connectionId = resolveConnectionId({
    properties,
    collection,
    collectionName,
    pageId,
    configKey,
  });

  const pageSize = type.isInt(properties.pageSize) ? properties.pageSize : 50;
  let sort = properties.sort;
  if (type.isNone(sort)) {
    sort = Object.hasOwn(collection.fields ?? {}, 'created_at') ? { created_at: -1 } : { _id: -1 };
  }

  // Projection: displayed columns + _id (for the row link) + rowLink token
  // fields + search fields, so the row link and rendering never miss a field.
  const projectionFields = new Set(['_id']);
  columns.forEach(({ resolved }) => projectionFields.add(resolved.field));
  searchFields.forEach((field) => projectionFields.add(field));
  const rowLink = type.isObject(properties.rowLink) ? properties.rowLink : null;
  if (rowLink) {
    Object.values({ ...(rowLink.urlQuery ?? {}), ...(rowLink.input ?? {}) }).forEach((value) => {
      if (type.isString(value) && value.startsWith('$')) projectionFields.add(value.slice(1));
    });
  }
  const projection = {};
  [...projectionFields].forEach((field) => {
    projection[field] = 1;
  });

  // The request payload carries every filter and the search box; the request
  // reads them with _payload (a request's own _state is always empty server
  // side — the lowdefy-list-pages trap).
  const payload = {};
  const queryDrops = [{}];
  filters.forEach(({ resolved }) => {
    payload[resolved.field] = { _state: `filters.${resolved.field}` };
    queryDrops.push(buildFilterQueryDrop(resolved.field));
  });
  if (searchFields.length > 0) {
    payload.search = { _state: 'filters.search' };
    queryDrops.push(buildSearchQueryDrop(searchFields));
  }

  const request = {
    id: LIST_REQUEST_ID,
    type: 'MongoDBFind',
    connectionId,
    payload,
    properties: {
      query: { '_object.assign': queryDrops },
      options: { sort, limit: pageSize, projection },
    },
  };

  // ---- blocks ----
  const title = type.isString(properties.title) ? properties.title : humanizeFieldName(collectionName);
  const headerBlocks = [
    { id: 'list_title', type: 'Title', properties: { content: title, level: 4 } },
  ];
  if (type.isArray(properties.actions)) {
    properties.actions.forEach((action) => headerBlocks.push(action));
  }

  const filterBlocks = filters.map((f) => buildFilterBlock(f));
  if (searchFields.length > 0) {
    filterBlocks.push({
      id: 'filters.search',
      type: 'TextInput',
      layout: { span: 8 },
      properties: { title: 'Search', allowClear: true },
      events: { onPressEnter: reloadActions() },
    });
  }
  if (filterBlocks.length > 0) {
    filterBlocks.push({
      id: 'clear_filters',
      type: 'Button',
      properties: { title: 'Clear', type: 'default' },
      events: {
        onClick: [{ id: 'clear', type: 'SetState', params: { filters: {} } }, ...reloadActions()],
      },
    });
  }

  // The row: a Card titled by the first column, with the remaining columns as
  // cells, and the row link on click.
  const [firstColumn, ...restColumns] = columns;
  const card = {
    id: `${ROWS_BLOCK_ID}.$.card`,
    type: 'Card',
    properties: {
      size: 'small',
      title: { _request: `${LIST_REQUEST_ID}.$.${firstColumn.resolved.field}` },
    },
    blocks: restColumns.map((column) => buildRowCell(column)),
  };
  if (rowLink) {
    const linkParams = {};
    if (type.isString(rowLink.pageId)) linkParams.pageId = rowLink.pageId;
    if (type.isString(rowLink.url)) linkParams.url = rowLink.url;
    if (rowLink.newWindow === true) linkParams.newWindow = true;
    const urlQuery = resolveRowTokens(rowLink.urlQuery);
    const input = resolveRowTokens(rowLink.input);
    if (Object.keys(urlQuery).length > 0) linkParams.urlQuery = urlQuery;
    if (Object.keys(input).length > 0) linkParams.input = input;
    card.events = { onClick: [{ id: 'open_row', type: 'Link', params: linkParams }] };
  }

  const emptyStateProps = type.isObject(properties.emptyState) ? properties.emptyState : {};
  const blocks = [
    {
      id: 'header',
      type: 'Box',
      layout: { justify: 'space-between', align: 'center' },
      blocks: headerBlocks,
    },
    { id: 'filters', type: 'Box', layout: { gap: 16 }, blocks: filterBlocks },
    {
      id: ROWS_BLOCK_ID,
      type: 'List',
      skeleton: {
        type: 'Box',
        blocks: [
          { type: 'Skeleton', properties: { height: 56 } },
          { type: 'Skeleton', properties: { height: 56 } },
        ],
      },
      blocks: [card],
    },
    {
      id: 'empty',
      type: 'Result',
      visible: {
        _and: [
          { _type: { type: 'array', on: { _request: LIST_REQUEST_ID } } },
          { _type: { type: 'empty', on: { _request: LIST_REQUEST_ID } } },
        ],
      },
      properties: {
        status: emptyStateProps.status ?? 'info',
        title: emptyStateProps.title ?? `No ${title.toLowerCase()} found`,
        ...(type.isString(emptyStateProps.subTitle) ? { subTitle: emptyStateProps.subTitle } : {}),
      },
    },
  ];

  const layout = type.isObject(properties.layout) ? properties.layout : {};
  return {
    layoutType: type.isString(layout.type) ? layout.type : 'Box',
    layoutProperties: type.isObject(layout.properties) ? layout.properties : {},
    events: { onInitAsync: reloadActions() },
    requests: [request],
    blocks,
  };
}

export default listPage;
