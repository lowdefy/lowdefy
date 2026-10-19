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

import { getOperatorType, type } from '@lowdefy/helpers';

import validate from './validate.js';

// Keywords that judge a value as a whole. An operator anywhere under the value
// can change which branch matches or what the value equals, so these cannot be
// judged before the operator evaluates.
const WHOLE_VALUE_KEYWORDS = new Set([
  'anyOf',
  'oneOf',
  'not',
  'if',
  'contains',
  'enum',
  'const',
  'uniqueItems',
]);

function escapePointerSegment(segment) {
  return String(segment).replace(/~/g, '~0').replace(/\//g, '~1');
}

// A copy of the data without ~ keys (~k, ~r, ~l, ~ignoreBuildChecks), with
// each operator node replaced by null, and the JSON pointer of each operator
// node. null keeps the operator's key, so additionalProperties still reports a
// misspelt key whose value is an operator. A key whose config value is null
// is left out: Lowdefy reads a null property as unset, and an unset module var
// or _build.env gives null where the schema wants a value.
function prepareData(value, path, operatorPaths) {
  if (type.isArray(value)) {
    return value.map((item, index) => prepareData(item, `${path}/${index}`, operatorPaths));
  }
  if (!type.isObject(value)) {
    return value;
  }
  if (getOperatorType(value) !== null) {
    operatorPaths.push(path);
    return null;
  }
  const prepared = {};
  for (const key of Object.keys(value)) {
    if (key.startsWith('~') || value[key] === null) continue;
    prepared[key] = prepareData(value[key], `${path}/${escapePointerSegment(key)}`, operatorPaths);
  }
  return prepared;
}

function isAtOrUnder(instancePath, path) {
  return instancePath === path || instancePath.startsWith(`${path}/`);
}

function hasOperatorUnder(error, operatorPaths) {
  return operatorPaths.some((path) => isAtOrUnder(path, error.instancePath));
}

// Every error, with the errors an errorMessage rewords.
function flattenErrors(errors) {
  return errors.flatMap((error) =>
    error.keyword === 'errorMessage'
      ? [error, ...flattenErrors(error.params?.errors ?? [])]
      : [error]
  );
}

// The branches of each whole-value keyword left out: a failed anyOf, oneOf or
// if keeps the errors of the branches it tried, under its own schema path (an
// if's under its sibling then and else). Plugin block, action and operator
// schemas use no $ref, so a branch error's schema path sits under its keyword.
function findUndecidedBranches(errors, operatorPaths) {
  return errors
    .filter((error) => WHOLE_VALUE_KEYWORDS.has(error.keyword))
    .filter((error) => hasOperatorUnder(error, operatorPaths))
    .map((error) => {
      if (error.keyword === 'if') {
        const parent = error.schemaPath.slice(0, -'/if'.length);
        return {
          instancePath: error.instancePath,
          schemaPaths: [`${parent}/then/`, `${parent}/else/`],
        };
      }
      return { instancePath: error.instancePath, schemaPaths: [`${error.schemaPath}/`] };
    });
}

function isInBranch(error, branches) {
  return branches.some(
    (branch) =>
      isAtOrUnder(error.instancePath, branch.instancePath) &&
      branch.schemaPaths.some((schemaPath) => error.schemaPath.startsWith(schemaPath))
  );
}

function isDecidedByOperator(error, { operatorPaths, branches }) {
  if (error.keyword === 'errorMessage') {
    // ajv-errors replaces the errors it rewords; the message stands only if
    // one of them does.
    const originals = error.params?.errors ?? [];
    return originals.every((original) =>
      isDecidedByOperator(original, { operatorPaths, branches })
    );
  }
  if (operatorPaths.some((path) => isAtOrUnder(error.instancePath, path))) {
    return true;
  }
  if (WHOLE_VALUE_KEYWORDS.has(error.keyword) && hasOperatorUnder(error, operatorPaths)) {
    return true;
  }
  return isInBranch(error, branches);
}

// The schema errors of config data that hold before its operators evaluate.
// Config data can hold operators anywhere, and an operator may evaluate to any
// value, so { _state: columns } may sit where the schema wants an array. Errors
// at or under an operator, and whole-value keywords above one with the errors
// of their branches, are left out.
// required and additionalProperties on a literal object still stand.
// Data that is itself one operator cannot be judged at all.
// The shared ajv instance keeps at most 20 errors per validation, and errors
// left out here count toward it, so data with many operators where the schema
// wants another type can hide a real error past the cap; it never adds one.
function getConfigSchemaErrors({ schema, data }) {
  if (getOperatorType(data) !== null) {
    return [];
  }
  const operatorPaths = [];
  const prepared = prepareData(data, '', operatorPaths);
  const result = validate({ schema, data: prepared, returnErrors: true });
  if (result.valid) {
    return [];
  }
  const branches = findUndecidedBranches(flattenErrors(result.errors), operatorPaths);
  return result.errors.filter((error) => !isDecidedByOperator(error, { operatorPaths, branches }));
}

export default getConfigSchemaErrors;
