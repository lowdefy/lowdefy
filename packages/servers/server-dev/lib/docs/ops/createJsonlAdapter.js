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

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { type } from '@lowdefy/helpers';

import getEventField from './getEventField.js';

// The laptop adapter: the same two methods computed over a saved JSONL export
// of the sink (one log line per row), so the ops tools answer without network
// access and the tests run against a fixture.
function toIsoTime(row) {
  const value = row._time ?? row.time;
  if (type.isNumber(value) || type.isString(value)) {
    return new Date(value).toISOString();
  }
  return null;
}

function matchesClause(row, [field, operator, value]) {
  const actual = getEventField(row, field);
  switch (operator) {
    case 'eq':
      return type.isNone(value) ? type.isNone(actual) : actual === value;
    case 'ne':
      return type.isNone(value) ? !type.isNone(actual) : actual !== value;
    case 'in':
      return value.includes(actual);
    case 'gt':
      return actual > value;
    case 'gte':
      return actual >= value;
    case 'lt':
      return actual < value;
    case 'lte':
      return actual <= value;
    default:
      throw new Error(`Ops query operator "${operator}" is not supported.`);
  }
}

function inWindow(time, { since, until }) {
  if (type.isNone(time)) {
    return type.isNone(since) && type.isNone(until);
  }
  if (!type.isNone(since) && time < since) {
    return false;
  }
  return type.isNone(until) || time <= until;
}

function percentileOf(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil(fraction * sorted.length);
  return sorted[Math.min(Math.max(rank, 1), sorted.length) - 1];
}

function reduceMetric({ metric, values, count }) {
  if (metric === 'count') {
    return count;
  }
  const [aggregation, field] = metric.split(':');
  const numbers = values.filter((value) => type.isNumber(value));
  if (numbers.length === 0) {
    return null;
  }
  const percentile = aggregation.match(/^p(\d{1,2}(\.\d+)?)$/);
  if (percentile !== null) {
    return percentileOf(numbers, Number(percentile[1]) / 100);
  }
  switch (aggregation) {
    case 'avg':
      return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
    case 'sum':
      return numbers.reduce((sum, value) => sum + value, 0);
    case 'min':
      return numbers.reduce((min, value) => (value < min ? value : min));
    case 'max':
      return numbers.reduce((max, value) => (value > max ? value : max));
    default:
      throw new Error(`Ops metric aggregation "${aggregation}" is not supported. Field ${field}.`);
  }
}

function metricAlias(metric) {
  if (metric === 'count') {
    return 'count';
  }
  const [aggregation, field] = metric.split(':');
  return `${aggregation}_${field.replace(/\./g, '_')}`;
}

function readRows(filePath) {
  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .reduce((rows, line) => {
      const trimmed = line.trim();
      // A saved terminal export interleaves the app's own stdout with the log
      // lines; only the JSON objects are events.
      if (!trimmed.startsWith('{')) {
        return rows;
      }
      const row = JSON.parse(trimmed);
      rows.push({ ...row, _time: toIsoTime(row) });
      return rows;
    }, []);
}

function compareTime(a, b, order) {
  const left = String(a._time);
  const right = String(b._time);
  return order === 'desc' ? right.localeCompare(left) : left.localeCompare(right);
}

function createJsonlAdapter({ url }) {
  const filePath = url.startsWith('file://') ? fileURLToPath(url) : url;

  function select({ where = [], since, until }) {
    return readRows(filePath).reduce((selected, row) => {
      if (!inWindow(row._time, { since, until })) {
        return selected;
      }
      if (!where.every((clause) => matchesClause(row, clause))) {
        return selected;
      }
      selected.push(row);
      return selected;
    }, []);
  }

  return {
    name: 'jsonl',
    async query({ where, since, until, limit, order = 'asc' }) {
      const rows = select({ where, since, until }).sort((a, b) => compareTime(a, b, order));
      return type.isNone(limit) ? rows : rows.slice(0, limit);
    },
    async aggregate({ where, since, until, limit, group_by: groupBy, metrics }) {
      const grouped = select({ where, since, until }).reduce((groups, row) => {
        const key = groupBy
          .map((field) => JSON.stringify(getEventField(row, field) ?? null))
          .join(' ');
        const group = groups.get(key) ?? [];
        group.push(row);
        groups.set(key, group);
        return groups;
      }, new Map());
      const results = [...grouped.values()].map((rows) => {
        const result = groupBy.reduce((fields, field) => {
          fields[field] = getEventField(rows[0], field) ?? null;
          return fields;
        }, {});
        metrics.forEach((metric) => {
          const field = metric === 'count' ? null : metric.split(':')[1];
          result[metricAlias(metric)] = reduceMetric({
            metric,
            count: rows.length,
            values: type.isNone(field) ? [] : rows.map((row) => getEventField(row, field)),
          });
        });
        return result;
      });
      const first = metricAlias(metrics[0]);
      results.sort((a, b) => (b[first] ?? 0) - (a[first] ?? 0));
      return type.isNone(limit) ? results : results.slice(0, limit);
    },
  };
}

export default createJsonlAdapter;
