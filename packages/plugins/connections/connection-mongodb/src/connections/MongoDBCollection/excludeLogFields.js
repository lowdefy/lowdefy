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

const EXCLUDED = '[excluded]';

function isOperatorObject(object) {
  return Object.keys(object).some((key) => key.startsWith('$'));
}

// The field paths an update key can name. "$" and "$[...]" parts say which elements a write
// reaches, not which field, so they are left out. A number part after the first is an array
// index or a field named by a number ("scores.2024"), so the key is read both ways.
function keyReadings(key) {
  return key.split('.').reduce(
    (readings, segment, index) => {
      if (segment === '$' || /^\$\[[^\]]*\]$/.test(segment)) return readings;
      const withSegment = readings.map((reading) => [...reading, segment]);
      if (index === 0 || !/^\d+$/.test(segment)) return withSegment;
      return [...readings, ...withSegment];
    },
    [[]]
  );
}

function startsWith(segments, prefix) {
  return prefix.length <= segments.length && prefix.every((segment, i) => segments[i] === segment);
}

// An expression above an excluded field: $mergeObjects and $literal hold the documents they
// write, so those are walked. Any other expression can compute the field from values it
// holds, which can not be told apart from the rest, so the whole expression is excluded.
function excludeInExpression(expression, segments) {
  if (type.isArray(expression.$mergeObjects)) {
    return {
      ...expression,
      $mergeObjects: expression.$mergeObjects.map((part) => excludeAt(part, segments)),
    };
  }
  if ('$literal' in expression) {
    return { ...expression, $literal: excludeAt(expression.$literal, segments) };
  }
  return EXCLUDED;
}

// The value with the field at `segments` marked excluded. An array is walked element by
// element, as MongoDB reads a path through an array.
function excludeAt(value, segments) {
  if (type.isArray(value)) return value.map((element) => excludeAt(element, segments));
  if (!type.isObject(value)) return value;
  // $push and $addToSet take the elements they add under $each.
  if (type.isArray(value.$each)) return { ...value, $each: excludeAt(value.$each, segments) };
  if (isOperatorObject(value)) return excludeInExpression(value, segments);
  const [first, ...rest] = segments;
  if (!(first in value)) return value;
  return {
    ...value,
    [first]: rest.length === 0 ? EXCLUDED : excludeAt(value[first], rest),
  };
}

// An object whose keys are field paths: a stored document, the fields of an update
// operator, or a pipeline stage's fields. A key at or under an excluded path has its value
// marked; a key above one has the excluded field marked inside its value.
function excludeFields(object, paths) {
  if (!type.isObject(object)) return object;
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => {
      const readings = keyReadings(key);
      let result = value;
      for (const path of paths) {
        if (readings.some((reading) => startsWith(reading, path))) return [key, EXCLUDED];
        readings.forEach((reading) => {
          if (startsWith(path, reading)) result = excludeAt(result, path.slice(reading.length));
        });
      }
      return [key, result];
    })
  );
}

// A replacement root sits above every field, so each path is excluded inside it. A root that
// is not an object ("$sub") is computed from the stored document and holds no written value.
function excludeRoot(root, paths) {
  return paths.reduce((result, path) => excludeAt(result, path), root);
}

function excludeStage(stage, paths) {
  if (!type.isObject(stage)) return stage;
  return Object.fromEntries(
    Object.entries(stage).map(([name, value]) => {
      if (name === '$replaceWith') return [name, excludeRoot(value, paths)];
      if (name === '$replaceRoot' && type.isObject(value)) {
        return [name, { ...value, newRoot: excludeRoot(value.newRoot, paths) }];
      }
      return [name, excludeFields(value, paths)];
    })
  );
}

function excludeUpdate(update, paths) {
  if (type.isArray(update)) return update.map((stage) => excludeStage(stage, paths));
  if (!type.isObject(update)) return update;
  if (!isOperatorObject(update)) return excludeFields(update, paths);
  return Object.fromEntries(
    Object.entries(update).map(([operator, fields]) => [operator, excludeFields(fields, paths)])
  );
}

function excludeBulkOperation(operation, paths) {
  if (!type.isObject(operation)) return operation;
  return Object.fromEntries(
    Object.entries(operation).map(([name, spec]) => {
      if (!type.isObject(spec)) return [name, spec];
      const result = { ...spec };
      if ('document' in spec) result.document = excludeFields(spec.document, paths);
      if ('replacement' in spec) result.replacement = excludeFields(spec.replacement, paths);
      if ('update' in spec) result.update = excludeUpdate(spec.update, paths);
      return [name, result];
    })
  );
}

// In array mode the changeset's rows are items of the array at `arrayPath`, so a path is
// read from inside the item: "items.pin" names the item field "pin", and "items", or a
// field above it, names every field of every item.
function excludeTableRow({ row, paths, arrayPath }) {
  if (type.isNone(arrayPath)) return excludeFields(row, paths);
  if (!type.isObject(row)) return row;
  const arraySegments = arrayPath.split('.');
  if (paths.some((path) => startsWith(arraySegments, path))) {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, key === 'rowKey' ? value : EXCLUDED])
    );
  }
  const itemPaths = paths
    .filter((path) => startsWith(path, arraySegments))
    .map((path) => path.slice(arraySegments.length));
  return excludeFields(row, itemPaths);
}

// MongoDBTableChanges logs the TableInput changeset: updated rows are { [rowKey]: { [field]:
// value } } and added rows are documents, or array items in array mode.
function excludeTableChanges({ changes, paths, arrayPath }) {
  if (!type.isObject(changes)) return changes;
  const result = { ...changes };
  if (type.isObject(changes.updated)) {
    result.updated = Object.fromEntries(
      Object.entries(changes.updated).map(([rowKey, values]) => [
        rowKey,
        excludeTableRow({ row: values, paths, arrayPath }),
      ])
    );
  }
  if (type.isArray(changes.added)) {
    result.added = changes.added.map((row) => excludeTableRow({ row, paths, arrayPath }));
  }
  return result;
}

// Enrichment cells are stored at `_enrich.<columnKey>.value`, so `_enrich`,
// `_enrich.<columnKey>` and `_enrich.<columnKey>.value` each exclude that cell's value.
function excludeEnrichmentResults(results, paths) {
  if (!type.isArray(results)) return results;
  return results.map((result) => {
    if (!type.isObject(result) || type.isUndefined(result.value)) return result;
    const cellPath = ['_enrich', result.columnKey, 'value'];
    if (!paths.some((path) => startsWith(cellPath, path))) return result;
    return { ...result, value: EXCLUDED };
  });
}

function excludeArgs({ args, paths, arrayPath }) {
  if (!type.isObject(args)) return args;
  const result = { ...args };
  if ('doc' in args) result.doc = excludeFields(args.doc, paths);
  if (type.isArray(args.docs)) result.docs = args.docs.map((doc) => excludeFields(doc, paths));
  if ('update' in args) result.update = excludeUpdate(args.update, paths);
  if (type.isArray(args.operations)) {
    result.operations = args.operations.map((operation) => excludeBulkOperation(operation, paths));
  }
  if ('changes' in args) {
    result.changes = excludeTableChanges({ changes: args.changes, paths, arrayPath });
  }
  if ('results' in args) result.results = excludeEnrichmentResults(args.results, paths);
  return result;
}

// changeLog.exclude lists fields, as dot paths, whose values the change log never holds.
// Every copy a record makes of a document or a write (before, after, the inserted
// documents, the update) gets "[excluded]" in place of each named field's value; a field the
// copy does not hold stays absent. A path through an array names the field in each element.
// `arrayPath` is the array a MongoDBTableChanges request in array mode writes into.
// Copies are new objects: the documents and update the request wrote are never changed.
function excludeLogFields({ record, connection, arrayPath }) {
  const fields = connection.changeLog?.exclude;
  if (!type.isArray(fields) || fields.length === 0) return record;
  const paths = fields.map((field) => field.split('.'));
  const result = { ...record, args: excludeArgs({ args: record.args, paths, arrayPath }) };
  if ('before' in record) result.before = excludeFields(record.before, paths);
  if ('after' in record) result.after = excludeFields(record.after, paths);
  return result;
}

export default excludeLogFields;
