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

import hashEnrichmentInputs from '@lowdefy/blocks-antd/table/hashEnrichmentInputs.js';

import createRandom from './createRandom.js';

const SYLLABLES = ['ka', 'lo', 'mi', 'ne', 'ro', 'sa', 'tu', 'vi', 'zo', 'an', 'el', 'or', 'us'];
const STATUSES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const OWNERS = ['Ada', 'Grace', 'Alan', 'Edsger', 'Barbara', 'Donald', 'Frances', 'Ken'];

const STATUS_OPTIONS = [
  { value: 'lead', label: 'Lead', color: 'default' },
  { value: 'qualified', label: 'Qualified', color: 'processing' },
  { value: 'proposal', label: 'Proposal', color: 'warning' },
  { value: 'negotiation', label: 'Negotiation', color: 'purple' },
  { value: 'won', label: 'Won', color: 'success' },
  { value: 'lost', label: 'Lost', color: 'error' },
];

// Column kinds cycled to build a CRM-like mixed set of any width: tier-0 cells (text, number,
// currency, tag, status, avatar, date, link, html, boolean, email) and a tier-1 `buttons` column
// shown on row hover (actions_12 pinned to the end). Kind 1 (name_1) and kind 6 (score_6) are the
// sort bench's text and number columns.
const KINDS = [
  { prefix: 'name', type: 'text', width: 180 },
  { prefix: 'amount', type: 'currency', cell: { currency: 'USD', locale: 'en-US' } },
  { prefix: 'status', type: 'tag', options: STATUS_OPTIONS },
  { prefix: 'created', type: 'date' },
  { prefix: 'owner', type: 'avatar', width: 170 },
  { prefix: 'score', type: 'number' },
  { prefix: 'stage', type: 'status', options: STATUS_OPTIONS },
  { prefix: 'profile', type: 'link', cell: { pageId: 'contact', urlQuery: { id: 'id' } } },
  {
    prefix: 'note',
    type: 'html',
    width: 180,
    cell: { template: '<b>{{ value }}</b> <span class="muted">#{{ row.id }}</span>' },
  },
  { prefix: 'active', type: 'boolean' },
  { prefix: 'email', type: 'email', width: 180 },
  {
    prefix: 'actions',
    type: 'buttons',
    width: 150,
    cell: {
      showOn: 'hover',
      buttons: [
        { eventName: 'onEdit', title: 'Edit' },
        { eventName: 'onOpen', title: 'Open', type: 'primary' },
      ],
    },
  },
];

function word(random) {
  let text = '';
  const count = 2 + Math.floor(random() * 3);
  for (let i = 0; i < count; i++) text += SYLLABLES[Math.floor(random() * SYLLABLES.length)];
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function createColumns(count) {
  const columns = [{ key: 'id', type: 'number', width: 90 }];
  for (let i = 1; i < count; i++) {
    const kind = KINDS[(i - 1) % KINDS.length];
    columns.push({
      key: `${kind.prefix}_${i}`,
      title: `${kind.prefix} ${i}`,
      type: kind.type,
      width: kind.width ?? 120,
      cell: kind.cell,
      options: kind.options,
      // The first actions column is pinned to the end, as a CRM's row actions are, so every
      // rendered row has one whatever the horizontal scroll.
      pinned: i === KINDS.length ? 'end' : undefined,
    });
  }
  return columns;
}

function createValue({ column, random }) {
  switch (column.type) {
    case 'currency':
      return Math.round(random() * 1e8) / 100;
    case 'tag':
    case 'status':
      return STATUSES[Math.floor(random() * STATUSES.length)];
    case 'avatar':
      return OWNERS[Math.floor(random() * OWNERS.length)];
    case 'link':
      return `${word(random)} ${word(random)}`;
    case 'html':
      return word(random);
    case 'buttons':
      return undefined;
    case 'date':
      return new Date(1.6e12 + Math.floor(random() * 1.5e11)).toISOString().slice(0, 10);
    case 'number':
      return Math.floor(random() * 1e6);
    case 'boolean':
      return random() > 0.5;
    case 'email':
      return `${word(random).toLowerCase()}@${word(random).toLowerCase()}.com`;
    case 'percent':
      return Math.round(random() * 10000) / 10000;
    default:
      if (column.key.startsWith('owner')) return OWNERS[Math.floor(random() * OWNERS.length)];
      return `${word(random)} ${word(random)}`;
  }
}

// Enrichment columns (`enrich: true`), placed after name_1 so they are in the first viewport: an
// enrichment and an ai column computing from name_1, their run states cycled per row (ok, some of
// them stale, running, queued, error, empty), so scrolling renders every state and hashes every
// done cell's inputs.
const ENRICH_COLUMNS = [
  {
    key: 'lead_email',
    kind: 'enrichment',
    type: 'email',
    provider: 'findEmail',
    inputs: { name: { column: 'name_1' } },
    width: 180,
  },
  {
    key: 'segment',
    kind: 'ai',
    type: 'tag',
    prompt: 'Segment of {{ name_1 }}',
    inputs: { name_1: { column: 'name_1' } },
    output: { type: 'tag', options: STATUS_OPTIONS },
    width: 130,
  },
];
const RUN_STATES = ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'running', 'queued', 'error', 'empty'];

function createRunState({ index, value, inputs }) {
  const status = RUN_STATES[index % RUN_STATES.length];
  if (status === 'error') return { status, error: 'The provider timed out.' };
  if (status !== 'ok') return { status };
  const inputHash = index % 4 === 0 ? '00000000000000' : hashEnrichmentInputs(inputs);
  return { status, value, inputHash, raw: { value } };
}

function addEnrichment({ columns, data }) {
  const at = columns.findIndex((column) => column.key === 'name_1') + 1;
  const enriched = [...columns.slice(0, at), ...ENRICH_COLUMNS, ...columns.slice(at)];
  data.forEach((row, index) => {
    row._enrich = {
      lead_email: createRunState({
        index,
        value: `lead${index}@example.com`,
        inputs: { name: row.name_1 },
      }),
      segment: createRunState({
        index: index + 3,
        value: STATUSES[index % STATUSES.length],
        inputs: { name_1: row.name_1 },
      }),
    };
  });
  return enriched;
}

function generateData({ rows, cols, seed = 42, enrich = false }) {
  const random = createRandom(seed);
  const columns = createColumns(cols);
  const data = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const row = { id: r };
    for (let c = 1; c < columns.length; c++) {
      row[columns[c].key] = createValue({ column: columns[c], random });
    }
    data[r] = row;
  }
  if (enrich) return { columns: addEnrichment({ columns, data }), data };
  return { columns, data };
}

export default generateData;
