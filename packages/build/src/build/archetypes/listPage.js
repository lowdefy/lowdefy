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
// Every generated cell id carries this prefix so no collection field name can
// ever collide with a generated block id (a field named "card" would otherwise
// produce a second "rows.$.card").
const CELL_ID_PREFIX = 'cell_';

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
    `ListPage on page "${pageId}" cannot derive a read connection for collection "${collectionName}" (${readConnections.length} candidates). Set the "connectionId" property.`,
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

// One of loading | error | success | empty from the list request's status form
// (_request { key, status: true }). Empty is a *successful* request that
// returned nothing, so an empty state and a failure state never both render,
// and a failure is never mistaken for an empty result.
function listStatus(key) {
  return { _get: { key, from: { _request: { key: LIST_REQUEST_ID, status: true } } } };
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

// The rendered value of one cell, chosen by the field's *declared* type — the
// whole point of resolving the field against collections:. A Date read straight
// into a text block stringifies as an ISO string; a boolean false renders as
// nothing at all. Both are formatted here instead.
function buildCellValue({ resolved }) {
  const value = { _request: `${LIST_REQUEST_ID}.$.${resolved.field}` };
  if (resolved.dataType === 'date') {
    return {
      _if: {
        test: { _type: { type: 'empty', on: value } },
        then: null,
        else: { '_intl.dateTimeFormat': { on: value, options: { dateStyle: 'medium' } } },
      },
    };
  }
  if (resolved.dataType === 'boolean') {
    return {
      _if: {
        test: { _type: { type: 'empty', on: value } },
        then: null,
        else: { _if: { test: value, then: 'Yes', else: 'No' } },
      },
    };
  }
  if (resolved.dataType === 'number' || resolved.dataType === 'integer') {
    return {
      _if: {
        test: { _type: { type: 'empty', on: value } },
        then: null,
        else: { '_intl.numberFormat': { on: value } },
      },
    };
  }
  return value;
}

// A cell is its label and its value: resolveCollectionField already humanises
// the field name, and a column of bare values with no heading is unreadable.
function buildRowCell({ resolved, overrides }) {
  const id = `${ROWS_BLOCK_ID}.$.${CELL_ID_PREFIX}${resolved.field}`;
  const value = buildCellValue({ resolved });
  const valueBlock = resolved.isEnum
    ? { id: `${id}.value`, type: 'Tag', properties: { title: value } }
    : { id: `${id}.value`, type: 'Paragraph', properties: { content: value } };
  return {
    id,
    type: 'Label',
    properties: {
      title: overrides.label ?? resolved.label,
      inline: true,
      size: 'small',
    },
    blocks: [valueBlock],
  };
}

// The default sort must name a field the collection actually declares. The
// first declared date field is the app's own "when did this happen" column
// whatever it is called; _id descending is the only honest fallback.
function defaultSort(collection) {
  const fields = collection.fields ?? {};
  const dateField = Object.keys(fields).find(
    (field) => fields[field]?.type === 'date' || fields[field]?.instanceof === 'Date'
  );
  if (type.isUndefined(dateField)) return { _id: -1 };
  return { [dateField]: -1 };
}

// The author's escape hatches. An archetype that cannot be extended has to be
// deleted and rewritten the first time it is 10% wrong, so a ListPage takes
// three named block lists placed at the obvious positions.
const SLOT_NAMES = ['header', 'rowActions', 'footer'];

function resolveSlots({ slots, pageId, configKey }) {
  if (type.isNone(slots)) return { header: [], rowActions: [], footer: [] };
  if (!type.isObject(slots)) {
    throw new ConfigError(
      `ListPage on page "${pageId}" slots must be an object. Received ${JSON.stringify(slots)}.`,
      { configKey, checkSlug: 'archetype' }
    );
  }
  const unknown = Object.keys(slots).filter((name) => !SLOT_NAMES.includes(name));
  if (unknown.length > 0) {
    throw new ConfigError(
      `ListPage on page "${pageId}" has no slot "${unknown[0]}". ListPage slots: ${SLOT_NAMES.join(
        ', '
      )}.`,
      { configKey, checkSlug: 'archetype' }
    );
  }
  const resolved = {};
  SLOT_NAMES.forEach((name) => {
    const slot = slots[name];
    if (type.isNone(slot)) {
      resolved[name] = [];
      return;
    }
    // The block schema's slot shape, so an archetype slot is written exactly
    // like any other block slot.
    if (!type.isObject(slot) || !type.isArray(slot.blocks)) {
      throw new ConfigError(
        `ListPage on page "${pageId}" slot "${name}" must be an object with a "blocks" list. Received ${JSON.stringify(
          slot
        )}.`,
        { configKey, checkSlug: 'archetype' }
      );
    }
    resolved[name] = slot.blocks;
  });
  return resolved;
}

// Generates a ListPage's layout, blocks and requests from its properties and
// the declared collection. Pure: no build context mutation, so it is unit
// testable in isolation.
function listPage({ properties, slots, pageId, collections, configKey }) {
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
  const slotBlocks = resolveSlots({ slots, pageId, configKey });

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
  const sort = type.isNone(properties.sort) ? defaultSort(collection) : properties.sort;

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
  const title = type.isString(properties.title)
    ? properties.title
    : humanizeFieldName(collectionName);
  const headerBlocks = [
    { id: 'list_title', type: 'Title', properties: { content: title, level: 4 } },
  ];
  if (type.isArray(properties.actions)) {
    properties.actions.forEach((action) => headerBlocks.push(action));
  }
  slotBlocks.header.forEach((block) => headerBlocks.push(block));

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
  // labelled cells, and the row link on click.
  const [firstColumn, ...restColumns] = columns;
  const cardBlocks = restColumns.map((column) => buildRowCell(column));
  if (slotBlocks.rowActions.length > 0) {
    cardBlocks.push({
      id: `${ROWS_BLOCK_ID}.$.row_actions`,
      type: 'Box',
      layout: { gap: 8 },
      blocks: slotBlocks.rowActions,
    });
  }
  const card = {
    id: `${ROWS_BLOCK_ID}.$.card`,
    type: 'Card',
    properties: {
      size: 'small',
      title: { _request: `${LIST_REQUEST_ID}.$.${firstColumn.resolved.field}` },
    },
    blocks: cardBlocks,
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
      visible: { _and: [listStatus('success'), listStatus('empty')] },
      properties: {
        status: emptyStateProps.status ?? 'info',
        title: emptyStateProps.title ?? `No ${title.toLowerCase()} found`,
        ...(type.isString(emptyStateProps.subTitle) ? { subTitle: emptyStateProps.subTitle } : {}),
      },
    },
    // A failed request leaves the response null, which is not an empty result —
    // without this block the page renders a header, a filter row and nothing
    // else, with the reason only in the browser console.
    {
      id: 'load_error',
      type: 'Result',
      visible: { _not: { _type: { type: 'none', on: listStatus('error') } } },
      properties: {
        status: 'error',
        title: `Could not load ${title.toLowerCase()}`,
        subTitle: listStatus('error'),
      },
      slots: {
        extra: {
          blocks: [
            {
              id: 'retry_list',
              type: 'Button',
              properties: { title: 'Retry' },
              events: { onClick: reloadActions() },
            },
          ],
        },
      },
    },
    ...slotBlocks.footer,
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

export { SLOT_NAMES };
export default listPage;
