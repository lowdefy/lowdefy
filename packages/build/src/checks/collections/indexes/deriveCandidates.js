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

// A candidate index is what one authored query asks the database to do:
// { equality, sort, range } in the ESR order MongoDB reads a compound index
// in - equality fields first, then the sort, then the ranges. The keys are
// read from the config as authored, so an operator-valued *value* is fine
// (only the field name matters) but an operator-valued filter or pipeline is
// not a literal and contributes nothing.

const LOGICAL_OPERATORS = new Set(['$and', '$or', '$nor']);
const RANGE_OPERATORS = new Set([
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$ne',
  '$nin',
  '$not',
  '$regex',
  '$exists',
]);

function isOperatorValue(value) {
  const keys = Object.keys(value).filter((key) => !key.startsWith('~'));
  return keys.length > 0 && keys.every((key) => key.startsWith('$'));
}

// `{ created_at: { $gt: x } }` scans a range of the index; `{ status: 'open' }`
// and `{ status: { $in: [...] } }` pin a point (or a union of points), which
// an index prefix serves. Everything else, including an operator-valued
// expression like `{ _state: 'q' }`, is an equality on the field name.
function classifyValue(value) {
  if (!type.isObject(value) || !isOperatorValue(value)) return 'equality';
  const operators = Object.keys(value).filter((key) => key.startsWith('$'));
  return operators.some((operator) => RANGE_OPERATORS.has(operator)) ? 'range' : 'equality';
}

function readFilter({ filter, candidate }) {
  if (!type.isObject(filter)) return;
  Object.keys(filter).forEach((key) => {
    if (key.startsWith('~')) return;
    if (LOGICAL_OPERATORS.has(key)) {
      if (!type.isArray(filter[key])) return;
      filter[key].forEach((branch) => readFilter({ filter: branch, candidate }));
      return;
    }
    // $expr, $text, $where and friends name no indexable field here.
    if (key.startsWith('$')) return;
    candidate[classifyValue(filter[key])].push({ field: key, direction: 1 });
  });
}

function readSort({ sort, candidate }) {
  if (!type.isObject(sort)) return;
  Object.keys(sort).forEach((key) => {
    if (key.startsWith('~')) return;
    candidate.sort.push({ field: key, direction: sort[key] === -1 ? -1 : 1 });
  });
}

function emptyCandidate() {
  return { equality: [], sort: [], range: [] };
}

function isEmpty(candidate) {
  return candidate.equality.length + candidate.sort.length + candidate.range.length === 0;
}

// Only the leading run of $match and $sort stages can use an index: once a
// $group, $unwind or $project has rewritten the documents the server is
// working in memory, so a later $match names fields no index on this
// collection can serve.
function readPipelineHead({ pipeline, candidate }) {
  for (const stage of pipeline) {
    if (!type.isObject(stage)) return;
    if (!type.isUndefined(stage.$match)) {
      readFilter({ filter: stage.$match, candidate });
      continue;
    }
    if (!type.isUndefined(stage.$sort)) {
      readSort({ sort: stage.$sort, candidate });
      continue;
    }
    return;
  }
}

// A $lookup joins on foreignField of the looked-up collection once per input
// document, which is the classic uncovered scan, so it is a candidate against
// `from`, not against the collection the pipeline runs on. localField is read
// from the input documents the stage already has in hand and no index on this
// collection serves it.
function readLookups({ pipeline, candidates }) {
  pipeline.forEach((stage) => {
    if (!type.isObject(stage) || !type.isObject(stage.$lookup)) return;
    const { from, foreignField } = stage.$lookup;
    if (!type.isString(from) || !type.isString(foreignField)) return;
    const foreign = emptyCandidate();
    foreign.collection = from;
    foreign.equality.push({ field: foreignField, direction: 1 });
    candidates.push(foreign);
  });
}

// A field named twice (two $or branches, a $match repeating the tenant field)
// is one index key, and _id already has an index nothing can drop, so neither
// belongs in a suggestion.
function normalize(candidate) {
  const seen = new Set(['_id']);
  const normalized = { collection: candidate.collection, equality: [], sort: [], range: [] };
  ['equality', 'sort', 'range'].forEach((part) => {
    candidate[part].forEach((key) => {
      if (seen.has(key.field)) return;
      seen.add(key.field);
      normalized[part].push(key);
    });
  });
  normalized.equality.sort((a, b) => a.field.localeCompare(b.field));
  normalized.range.sort((a, b) => a.field.localeCompare(b.field));
  return normalized;
}

function deriveCandidates({ properties }) {
  const candidates = [];
  const direct = emptyCandidate();
  readFilter({ filter: properties.query, candidate: direct });
  readFilter({ filter: properties.filter, candidate: direct });
  readSort({ sort: properties.options?.sort, candidate: direct });
  if (type.isArray(properties.pipeline)) {
    readPipelineHead({ pipeline: properties.pipeline, candidate: direct });
    readLookups({ pipeline: properties.pipeline, candidates });
  }
  candidates.push(direct);
  return candidates.map(normalize).filter((candidate) => !isEmpty(candidate));
}

export default deriveCandidates;
