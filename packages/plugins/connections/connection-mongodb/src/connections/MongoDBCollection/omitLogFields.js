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

const OMITTED = '[omitted]';

// A key names a field by its first path segment: "body.html" writes the field "body".
function omitKeys(object, omit) {
  if (!type.isObject(object)) return object;
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => [
      key,
      omit.has(key.split('.')[0]) ? OMITTED : value,
    ])
  );
}

function isOperatorObject(object) {
  return Object.keys(object).some((key) => key.startsWith('$'));
}

// A replacement root is a literal document or a $mergeObjects of documents; any other
// expression is computed from the stored document, so it holds no written value.
function omitExpression(expression, omit) {
  if (!type.isObject(expression)) return expression;
  if (type.isArray(expression.$mergeObjects)) {
    return {
      ...expression,
      $mergeObjects: expression.$mergeObjects.map((part) => omitExpression(part, omit)),
    };
  }
  if (isOperatorObject(expression)) return expression;
  return omitKeys(expression, omit);
}

function omitStage(stage, omit) {
  if (!type.isObject(stage)) return stage;
  return Object.fromEntries(
    Object.entries(stage).map(([name, value]) => {
      if (name === '$replaceWith') return [name, omitExpression(value, omit)];
      if (name === '$replaceRoot' && type.isObject(value)) {
        return [name, { ...value, newRoot: omitExpression(value.newRoot, omit) }];
      }
      return [name, omitKeys(value, omit)];
    })
  );
}

function omitUpdate(update, omit) {
  if (type.isArray(update)) return update.map((stage) => omitStage(stage, omit));
  if (!type.isObject(update)) return update;
  if (!isOperatorObject(update)) return omitKeys(update, omit);
  return Object.fromEntries(
    Object.entries(update).map(([operator, fields]) => [operator, omitKeys(fields, omit)])
  );
}

function omitBulkOperation(operation, omit) {
  if (!type.isObject(operation)) return operation;
  return Object.fromEntries(
    Object.entries(operation).map(([name, spec]) => {
      if (!type.isObject(spec)) return [name, spec];
      const result = { ...spec };
      if ('document' in spec) result.document = omitKeys(spec.document, omit);
      if ('replacement' in spec) result.replacement = omitKeys(spec.replacement, omit);
      if ('update' in spec) result.update = omitUpdate(spec.update, omit);
      return [name, result];
    })
  );
}

// MongoDBTableChanges logs the TableInput changeset: updated rows are { [rowKey]: { [field]:
// value } } and added rows are documents.
function omitTableChanges(changes, omit) {
  if (!type.isObject(changes)) return changes;
  const result = { ...changes };
  if (type.isObject(changes.updated)) {
    result.updated = Object.fromEntries(
      Object.entries(changes.updated).map(([rowKey, values]) => [rowKey, omitKeys(values, omit)])
    );
  }
  if (type.isArray(changes.added)) {
    result.added = changes.added.map((row) => omitKeys(row, omit));
  }
  return result;
}

// Enrichment cells are stored under `_enrich`, so omitting `_enrich` omits the values the
// enrichment log copies.
function omitEnrichmentResults(results, omit) {
  if (!type.isArray(results) || !omit.has('_enrich')) return results;
  return results.map((result) =>
    type.isObject(result) && 'value' in result ? { ...result, value: OMITTED } : result
  );
}

function omitArgs(args, omit) {
  if (!type.isObject(args)) return args;
  const result = { ...args };
  if ('doc' in args) result.doc = omitKeys(args.doc, omit);
  if (type.isArray(args.docs)) result.docs = args.docs.map((doc) => omitKeys(doc, omit));
  if ('update' in args) result.update = omitUpdate(args.update, omit);
  if (type.isArray(args.operations)) {
    result.operations = args.operations.map((operation) => omitBulkOperation(operation, omit));
  }
  if ('changes' in args) result.changes = omitTableChanges(args.changes, omit);
  if ('results' in args) result.results = omitEnrichmentResults(args.results, omit);
  return result;
}

// changeLog.omit lists top-level fields whose values the change log never holds. Every copy a
// record makes of a document or a write (before, after, the inserted documents, the update)
// gets "[omitted]" in place of each named field's value; a field the copy does not hold stays
// absent. Copies are new objects: the documents and update the request wrote are never changed.
function omitLogFields({ record, connection }) {
  const fields = connection.changeLog?.omit;
  if (!type.isArray(fields) || fields.length === 0) return record;
  const omit = new Set(fields);
  const result = { ...record, args: omitArgs(record.args, omit) };
  if ('before' in record) result.before = omitKeys(record.before, omit);
  if ('after' in record) result.after = omitKeys(record.after, omit);
  return result;
}

export { OMITTED };
export default omitLogFields;
