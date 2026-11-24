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

// Positional parts of an update path ("items.$.pin", "items.$[].pin", "items.$[x].pin",
// "items.0.pin") say which elements a write reaches, not which field, so a path is
// matched with them left out.
function isPositional(segment) {
  return segment === '$' || /^\$\[[^\]]*\]$/.test(segment) || /^\d+$/.test(segment);
}

function fieldSegments(key) {
  return key.split('.').filter((segment) => !isPositional(segment));
}

function startsWith(segments, prefix) {
  return prefix.length <= segments.length && prefix.every((segment, i) => segments[i] === segment);
}

// The value with the field at `segments` marked excluded. An array is walked element by
// element, as MongoDB reads a path through an array.
function excludeAt(value, segments) {
  if (type.isArray(value)) return value.map((element) => excludeAt(element, segments));
  if (!type.isObject(value)) return value;
  // $push and $addToSet take the elements they add under $each.
  if (type.isArray(value.$each)) return { ...value, $each: excludeAt(value.$each, segments) };
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
      const keySegments = fieldSegments(key);
      let result = value;
      for (const path of paths) {
        if (startsWith(keySegments, path)) return [key, EXCLUDED];
        if (startsWith(path, keySegments))
          result = excludeAt(result, path.slice(keySegments.length));
      }
      return [key, result];
    })
  );
}

function isOperatorObject(object) {
  return Object.keys(object).some((key) => key.startsWith('$'));
}

// A replacement root is a literal document or a $mergeObjects of documents; any other
// expression is computed from the stored document, so it holds no written value.
function excludeExpression(expression, paths) {
  if (!type.isObject(expression)) return expression;
  if (type.isArray(expression.$mergeObjects)) {
    return {
      ...expression,
      $mergeObjects: expression.$mergeObjects.map((part) => excludeExpression(part, paths)),
    };
  }
  if (isOperatorObject(expression)) return expression;
  return excludeFields(expression, paths);
}

function excludeStage(stage, paths) {
  if (!type.isObject(stage)) return stage;
  return Object.fromEntries(
    Object.entries(stage).map(([name, value]) => {
      if (name === '$replaceWith') return [name, excludeExpression(value, paths)];
      if (name === '$replaceRoot' && type.isObject(value)) {
        return [name, { ...value, newRoot: excludeExpression(value.newRoot, paths) }];
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

// MongoDBTableChanges logs the TableInput changeset: updated rows are { [rowKey]: { [field]:
// value } } and added rows are documents.
function excludeTableChanges(changes, paths) {
  if (!type.isObject(changes)) return changes;
  const result = { ...changes };
  if (type.isObject(changes.updated)) {
    result.updated = Object.fromEntries(
      Object.entries(changes.updated).map(([rowKey, values]) => [
        rowKey,
        excludeFields(values, paths),
      ])
    );
  }
  if (type.isArray(changes.added)) {
    result.added = changes.added.map((row) => excludeFields(row, paths));
  }
  return result;
}

// Enrichment cells are stored under `_enrich`, so excluding `_enrich` excludes the values the
// enrichment log copies.
function excludeEnrichmentResults(results, paths) {
  if (!type.isArray(results) || !paths.some((path) => path.length === 1 && path[0] === '_enrich')) {
    return results;
  }
  return results.map((result) =>
    type.isObject(result) && 'value' in result ? { ...result, value: EXCLUDED } : result
  );
}

function excludeArgs(args, paths) {
  if (!type.isObject(args)) return args;
  const result = { ...args };
  if ('doc' in args) result.doc = excludeFields(args.doc, paths);
  if (type.isArray(args.docs)) result.docs = args.docs.map((doc) => excludeFields(doc, paths));
  if ('update' in args) result.update = excludeUpdate(args.update, paths);
  if (type.isArray(args.operations)) {
    result.operations = args.operations.map((operation) => excludeBulkOperation(operation, paths));
  }
  if ('changes' in args) result.changes = excludeTableChanges(args.changes, paths);
  if ('results' in args) result.results = excludeEnrichmentResults(args.results, paths);
  return result;
}

// changeLog.exclude lists fields, as dot paths, whose values the change log never holds.
// Every copy a record makes of a document or a write (before, after, the inserted
// documents, the update) gets "[excluded]" in place of each named field's value; a field the
// copy does not hold stays absent. A path through an array names the field in each element.
// Copies are new objects: the documents and update the request wrote are never changed.
function excludeLogFields({ record, connection }) {
  const fields = connection.changeLog?.exclude;
  if (!type.isArray(fields) || fields.length === 0) return record;
  const paths = fields.map((field) => field.split('.'));
  const result = { ...record, args: excludeArgs(record.args, paths) };
  if ('before' in record) result.before = excludeFields(record.before, paths);
  if ('after' in record) result.after = excludeFields(record.after, paths);
  return result;
}

export { EXCLUDED };
export default excludeLogFields;
