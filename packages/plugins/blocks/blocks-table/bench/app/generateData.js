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

import createRandom from './createRandom.js';

const SYLLABLES = ['ka', 'lo', 'mi', 'ne', 'ro', 'sa', 'tu', 'vi', 'zo', 'an', 'el', 'or', 'us'];
const STATUSES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const OWNERS = ['Ada', 'Grace', 'Alan', 'Edsger', 'Barbara', 'Donald', 'Frances', 'Ken'];

// Column kinds cycled to build a CRM-like mixed set of any width.
const KINDS = [
  { prefix: 'name', type: 'text' },
  { prefix: 'amount', type: 'currency' },
  { prefix: 'status', type: 'tag' },
  { prefix: 'created', type: 'date' },
  { prefix: 'owner', type: 'text' },
  { prefix: 'score', type: 'number' },
  { prefix: 'active', type: 'boolean' },
  { prefix: 'email', type: 'email' },
  { prefix: 'rate', type: 'percent' },
  { prefix: 'company', type: 'text' },
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
      width: kind.type === 'text' || kind.type === 'email' ? 180 : 120,
    });
  }
  return columns;
}

function createValue({ column, random }) {
  switch (column.type) {
    case 'currency':
      return Math.round(random() * 1e8) / 100;
    case 'tag':
      return STATUSES[Math.floor(random() * STATUSES.length)];
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

function generateData({ rows, cols, seed = 42 }) {
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
  return { columns, data };
}

export default generateData;
