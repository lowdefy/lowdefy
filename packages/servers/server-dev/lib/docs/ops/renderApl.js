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

// The only place a vendor query language is written. The tools speak the
// closed vocabulary (where / since / until / group_by / metrics) and this
// renders it; nothing above it may pass an APL fragment through, which is why
// every field name and every value is checked here rather than interpolated.
const FIELD_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/;

const OPERATORS = {
  eq: '==',
  ne: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
};

const AGGREGATIONS = {
  count: () => 'count()',
  avg: (field) => `avg(${field})`,
  min: (field) => `min(${field})`,
  max: (field) => `max(${field})`,
  sum: (field) => `sum(${field})`,
};

function renderField(field) {
  if (!type.isString(field) || !FIELD_PATTERN.test(field)) {
    throw new Error(`Ops query field is not a field name. Received ${JSON.stringify(field)}.`);
  }
  return field;
}

function renderLiteral(value) {
  if (type.isString(value)) {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }
  if (type.isBoolean(value)) {
    return String(value);
  }
  if (type.isNumber(value)) {
    return String(value);
  }
  throw new Error(`Ops query value is not a scalar. Received ${JSON.stringify(value)}.`);
}

function renderClause([field, operator, value]) {
  const rendered = renderField(field);
  if (operator === 'in') {
    if (!type.isArray(value)) {
      throw new Error(`Ops query operator "in" needs an array. Received ${JSON.stringify(value)}.`);
    }
    return `${rendered} in (${value.map(renderLiteral).join(', ')})`;
  }
  if (operator === 'eq' && type.isNone(value)) {
    return `isnull(${rendered})`;
  }
  if (operator === 'ne' && type.isNone(value)) {
    return `isnotnull(${rendered})`;
  }
  const aplOperator = OPERATORS[operator];
  if (type.isNone(aplOperator)) {
    throw new Error(
      `Ops query operator "${operator}" is not one of ${Object.keys(OPERATORS)
        .concat('in')
        .join(', ')}.`
    );
  }
  return `${rendered} ${aplOperator} ${renderLiteral(value)}`;
}

function renderTimeClauses({ since, until }) {
  const clauses = [];
  if (!type.isNone(since)) {
    clauses.push(`_time >= datetime(${renderLiteral(since)})`);
  }
  if (!type.isNone(until)) {
    clauses.push(`_time <= datetime(${renderLiteral(until)})`);
  }
  return clauses;
}

// 'count' or '<aggregation>:<field>', e.g. 'p95:duration_ms', 'avg:duration_ms'.
function renderMetric(metric) {
  if (metric === 'count') {
    return { alias: 'count', expression: 'count()' };
  }
  if (!type.isString(metric) || !metric.includes(':')) {
    throw new Error(`Ops metric "${JSON.stringify(metric)}" is not "count" or "<agg>:<field>".`);
  }
  const [aggregation, field] = metric.split(':');
  const rendered = renderField(field);
  const alias = `${aggregation}_${field.replace(/\./g, '_')}`;
  const percentile = aggregation.match(/^p(\d{1,2}(\.\d+)?)$/);
  if (percentile !== null) {
    return { alias, expression: `percentile(${rendered}, ${percentile[1]})` };
  }
  const render = AGGREGATIONS[aggregation];
  if (type.isNone(render)) {
    throw new Error(
      `Ops metric aggregation "${aggregation}" is not one of ${Object.keys(AGGREGATIONS)
        .concat('p50, p95, p99')
        .join(', ')}.`
    );
  }
  return { alias, expression: render(rendered) };
}

function renderApl({ dataset, where = [], since, until, limit, order = 'asc', groupBy, metrics }) {
  if (!type.isString(dataset) || dataset === '') {
    throw new Error(`Ops query dataset is missing. Received ${JSON.stringify(dataset)}.`);
  }
  const stages = [`['${dataset.replace(/'/g, "\\'")}']`];
  const clauses = where.map(renderClause).concat(renderTimeClauses({ since, until }));
  if (clauses.length > 0) {
    stages.push(`where ${clauses.join(' and ')}`);
  }
  if (type.isNone(groupBy)) {
    stages.push(`order by _time ${order === 'desc' ? 'desc' : 'asc'}`);
    if (!type.isNone(limit)) {
      stages.push(`limit ${Math.trunc(limit)}`);
    }
    return stages.join(' | ');
  }
  const rendered = metrics.map(renderMetric);
  const by = groupBy.map(renderField);
  stages.push(
    `summarize ${rendered
      .map(({ alias, expression }) => `${alias}=${expression}`)
      .join(', ')} by ${by.join(', ')}`
  );
  stages.push(`order by ${rendered[0].alias} desc`);
  if (!type.isNone(limit)) {
    stages.push(`limit ${Math.trunc(limit)}`);
  }
  return stages.join(' | ');
}

export default renderApl;
